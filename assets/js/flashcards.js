// Flashcards: spaced-style mark-as-known list with category filter & shuffle.

const FLASHCARDS = [
  // ----- Go language -----
  { cat: "Go Basics", q: "What is the zero value of a string, int, bool, slice, map, pointer in Go?",
    a: "string='', int=0, bool=false, slice=nil (len 0, cap 0), map=nil (read OK, write panics), pointer=nil. Composite literals start zero-valued unless initialized." },
  { cat: "Go Basics", q: "Difference between `var x = T{}` and `new(T)`.",
    a: "`T{}` returns a value of type T (zero-valued composite). `new(T)` returns *T pointing to a zero value. For slices/maps/channels prefer `make`." },
  { cat: "Go Basics", q: "When to use make vs new?",
    a: "Use `make` for slices, maps and channels (it initializes the runtime header). Use `new` to allocate any other type and obtain a pointer to its zero value." },
  { cat: "Go Basics", q: "How does a slice header look in memory?",
    a: "It is a struct {ptr *T, len int, cap int}. Slicing reuses the underlying array; append may allocate a new one when len==cap." },
  { cat: "Go Basics", q: "Why can appending to a slice cause silent bugs?",
    a: "If cap > len, append mutates the shared backing array; other slices pointing to that array see the change. Always reassign and copy when you need isolation." },
  { cat: "Go Basics", q: "How does Go pass arguments?",
    a: "Always by value. But slices, maps, channels, interfaces, functions, pointers contain reference-like headers, so callees can mutate the underlying data." },
  { cat: "Go Basics", q: "Difference between a method with pointer receiver vs value receiver.",
    a: "Pointer receiver can mutate the receiver and avoids copying large structs; required when implementing an interface for mutation. Mixing receivers on the same type is discouraged." },

  // ----- Interfaces & errors -----
  { cat: "Go Advanced", q: "What is an interface value internally?",
    a: "A pair (type descriptor, value/pointer). A nil interface requires both halves nil. A typed nil pointer wrapped in an interface is NOT a nil interface." },
  { cat: "Go Advanced", q: "How do you check error types in modern Go?",
    a: "Use errors.Is for sentinel comparisons and errors.As for typed unwrapping. Wrap with fmt.Errorf(\"...: %w\", err)." },
  { cat: "Go Advanced", q: "Embedding vs inheritance.",
    a: "Go has no inheritance. Struct embedding promotes fields and methods. Method dispatch is static; no virtual table on embedded types." },
  { cat: "Go Advanced", q: "What is iota?",
    a: "A compile-time counter inside const blocks. Resets per block, increments per ConstSpec; used for enum-like declarations and bit flags (1 << iota)." },
  { cat: "Go Advanced", q: "Difference between buffered and unbuffered channels.",
    a: "Unbuffered: send blocks until a receiver is ready (rendezvous). Buffered: send blocks only when the buffer is full. Closed channel reads return zero value with ok=false." },

  // ----- Concurrency -----
  { cat: "Concurrency", q: "What does the GMP scheduler stand for?",
    a: "Goroutine, Machine (OS thread), Processor (logical, GOMAXPROCS). P holds local run queues; M executes goroutines bound to a P." },
  { cat: "Concurrency", q: "When does a goroutine yield?",
    a: "On channel ops, syscall, function preemption points (since 1.14 async preemption every ~10ms), GC safe points, time.Sleep, network I/O." },
  { cat: "Concurrency", q: "Detecting data races?",
    a: "Run tests/binaries with `-race`. The race detector instruments memory accesses; only reports observed races during the run." },
  { cat: "Concurrency", q: "sync.Mutex vs sync.RWMutex when to use which?",
    a: "RWMutex is only beneficial under heavy read load with rare writes; otherwise plain Mutex is faster due to lower overhead." },
  { cat: "Concurrency", q: "How does context cancellation propagate?",
    a: "Each derived ctx (WithCancel/Timeout/Deadline) listens to its parent's Done channel. Calling cancel closes Done; goroutines should select on ctx.Done() and return ctx.Err()." },
  { cat: "Concurrency", q: "Pattern for fan-out/fan-in.",
    a: "Spawn N workers reading from a shared input chan; merge their outputs into one channel via a select / sync.WaitGroup; close output when all workers finish." },
  { cat: "Concurrency", q: "What is errgroup?",
    a: "golang.org/x/sync/errgroup: Group with Go() spawns tasks and Wait returns the first non-nil error. With WithContext it cancels siblings on first error." },

  // ----- Memory & GC -----
  { cat: "Memory & GC", q: "Stack vs heap allocation in Go?",
    a: "Compiler does escape analysis; values that don't escape live on the goroutine stack (cheap, no GC). Escapes go to the heap." },
  { cat: "Memory & GC", q: "What kind of GC does Go use?",
    a: "Concurrent, tri-color, mark-sweep with write barriers, non-generational, non-compacting. Tuned by GOGC (default 100%)." },
  { cat: "Memory & GC", q: "Why are short-lived allocations cheap?",
    a: "Per-P mcache provides bump-pointer-style fast paths from size-classed spans (mcentral/mheap), and many allocations stay on the stack via escape analysis." },

  // ----- Patterns: arrays / two pointers / sliding window -----
  { cat: "Patterns", q: "Two Sum (sorted) approach in O(n)?",
    a: "Two pointers from both ends, move l++ if sum<target else r--. For unsorted: hash map of complement → index in O(n)." },
  { cat: "Patterns", q: "Sliding window template?",
    a: "for r:=0; r<n; r++ { add nums[r]; while invalid { remove nums[l]; l++ }; update answer with [l..r] }. Works when adding can only worsen the constraint." },
  { cat: "Patterns", q: "Kadane's algorithm?",
    a: "best=cur=nums[0]; for i in 1..n: cur=max(nums[i], cur+nums[i]); best=max(best,cur). O(n) maximum subarray sum." },
  { cat: "Patterns", q: "Quickselect for k-th element?",
    a: "Hoare/Lomuto partition; recurse only into the side containing k. Average O(n), worst O(n²). Use median-of-3 or randomized pivot." },
  { cat: "Patterns", q: "Cyclic sort use cases?",
    a: "When numbers are in range [1..n] / [0..n] – place each number at its correct index in O(n), then a linear scan finds missing/duplicates." },

  // ----- Linked lists / stacks / queues -----
  { cat: "Patterns", q: "Detect a cycle in a linked list?",
    a: "Floyd's tortoise & hare. To find the cycle start, reset one pointer to head and advance both by 1; meet point is the cycle entry." },
  { cat: "Patterns", q: "Reverse a linked list iteratively?",
    a: "var prev *Node; cur:=head; for cur!=nil { nxt:=cur.Next; cur.Next=prev; prev=cur; cur=nxt }; return prev." },
  { cat: "Patterns", q: "Monotonic stack — when to use?",
    a: "Next greater/smaller element, largest rectangle in histogram, daily temperatures, stock span. Stack of indices kept increasing or decreasing." },
  { cat: "Patterns", q: "Implement a queue with two stacks?",
    a: "Push to inStack; on Pop/Peek, if outStack empty move all from inStack reversing order; pop from outStack. Amortized O(1)." },

  // ----- Trees / graphs / heaps / tries -----
  { cat: "Patterns", q: "Validate a BST in O(n) without recursion overhead?",
    a: "In-order traversal must be strictly increasing. Or pass (lo, hi) bounds in recursion: each node must be in (lo, hi)." },
  { cat: "Patterns", q: "Lowest Common Ancestor in a binary tree?",
    a: "DFS returns node if it equals p or q, else recurse left/right. If both sides return non-nil → current is LCA, else return the non-nil side." },
  { cat: "Patterns", q: "BFS vs DFS — which for shortest path on unweighted graph?",
    a: "BFS gives shortest path in edges. For weighted non-negative edges use Dijkstra (binary heap). Negative edges → Bellman-Ford. All-pairs → Floyd-Warshall." },
  { cat: "Patterns", q: "Topological sort approaches?",
    a: "Kahn's algorithm (BFS with in-degree=0 queue) or DFS post-order reversed. Detect cycle when output count < V (Kahn) or back-edge in DFS." },
  { cat: "Patterns", q: "Union-Find optimizations?",
    a: "Union by rank/size + path compression → near O(α(n)) per op. Used for Kruskal MST, dynamic connectivity, accounts merge." },
  { cat: "Patterns", q: "Trie operations & complexity?",
    a: "Insert/search/prefix in O(L) where L=word length. Useful for autocomplete, word dictionaries, XOR maximum (binary trie)." },

  // ----- DP -----
  { cat: "DP", q: "Steps to derive a DP recurrence?",
    a: "1) Define state precisely. 2) Identify transitions. 3) Base cases. 4) Order of computation (top-down memo or bottom-up). 5) Optimize space if rolling." },
  { cat: "DP", q: "0/1 knapsack 1D space optimization?",
    a: "Iterate items outer, capacity from W down to w[i] inner, dp[c]=max(dp[c], dp[c-w[i]]+v[i]). Reverse loop prevents reusing the same item." },
  { cat: "DP", q: "Longest Increasing Subsequence in O(n log n)?",
    a: "Maintain `tails`: smallest tail of an increasing subsequence of length i+1. For each x, binary-search and replace; length of tails is the answer." },
  { cat: "DP", q: "Edit distance recurrence?",
    a: "dp[i][j]=dp[i-1][j-1] if equal else 1+min(dp[i-1][j-1] sub, dp[i-1][j] del, dp[i][j-1] ins). Base: dp[0][j]=j, dp[i][0]=i." },

  // ----- System Design -----
  { cat: "System Design", q: "Latency vs throughput vs availability vs durability?",
    a: "Latency=time per request. Throughput=requests/sec. Availability=% time system up. Durability=probability data is not lost once acknowledged." },
  { cat: "System Design", q: "CAP theorem in practice?",
    a: "Under network partition you must choose Consistency or Availability. Most systems are AP with tunable consistency (Cassandra/Dynamo) or CP (HBase/etcd)." },
  { cat: "System Design", q: "When pick SQL vs NoSQL?",
    a: "SQL for relations, transactions, joins, schema enforcement. NoSQL for high write throughput, flexible schema, horizontal scaling, key-value/document/wide-column/graph specialization." },
  { cat: "System Design", q: "Consistent hashing — why?",
    a: "Distribute keys across nodes such that adding/removing a node remaps only K/N keys. Use virtual nodes to balance load. Used by caches, databases, load balancers." },
  { cat: "System Design", q: "Difference between optimistic and pessimistic locking?",
    a: "Pessimistic: acquire lock before update (SELECT ... FOR UPDATE). Optimistic: read with version, update WHERE version=v; retry on conflict. Optimistic scales better under low contention." },
  { cat: "System Design", q: "How do you design idempotent APIs?",
    a: "Client supplies an idempotency key; server stores (key → result/status) with TTL. Replays return the same response. Use unique constraints in DB and dedup at the message broker." },
  { cat: "System Design", q: "What is read-through vs write-through vs write-back caching?",
    a: "Read-through: cache fetches from DB on miss. Write-through: writes go to cache+DB synchronously. Write-back: writes to cache only, flushed asynchronously (risk of data loss)." },
  { cat: "System Design", q: "Outbox pattern?",
    a: "Within a DB transaction, write business state and an event row to an outbox table. A relay polls the outbox and publishes to a broker, achieving at-least-once event delivery." },
  { cat: "System Design", q: "Saga pattern?",
    a: "Long-running distributed transaction modeled as a sequence of local transactions with compensating actions. Choreography (events) vs orchestration (central coordinator)." },
  { cat: "System Design", q: "How to size a cache?",
    a: "Estimate working set (hot keys × avg value size × replication). Pick eviction policy (LRU/LFU/TTL). Monitor hit ratio; aim 80%+ for read-heavy workloads." },
  { cat: "System Design", q: "Rate limiter algorithms?",
    a: "Token bucket (burst + steady), leaky bucket (smooth), fixed window (simple, edge bursts), sliding window log/counters (accurate, more memory). Distributed → Redis with Lua scripts." },
  { cat: "System Design", q: "Kafka delivery semantics?",
    a: "At-most-once (autocommit before processing), at-least-once (commit after), exactly-once (idempotent producer + transactional writes + read-process-write within a tx)." },
  { cat: "System Design", q: "Strong vs eventual consistency?",
    a: "Strong: all reads see the latest write. Eventual: replicas converge eventually. Tunable via quorum (R+W>N for strong on Dynamo-style)." },
  { cat: "System Design", q: "How would you design a URL shortener? Quick outline.",
    a: "1) API: POST /shorten, GET /:code → 301. 2) Code = base62 of an ID (Snowflake/sequence) or hash+collision retry. 3) KV store (Redis hot cache + DB). 4) Counters via stream → analytics." },
  { cat: "System Design", q: "How does a load balancer decide where to send traffic?",
    a: "L4: by IP/port, round-robin, least-connections. L7: by URL/headers/cookies, host-based routing, weighted, with health checks and outlier detection." },

  // ============================================================
  // ===========  ADDITIONAL FLASHCARDS  ========================
  // ============================================================

  // ----- Go Basics (more) -----
  { cat: "Go Basics", q: "What does `defer` do, and what's the gotcha with arguments?",
    a: "Schedules a function call to run when the surrounding function returns (LIFO order). Arguments are evaluated at defer-time, but the call runs at return-time. Useful for Close/Unlock; avoid in tight loops." },
  { cat: "Go Basics", q: "Difference between an array and a slice.",
    a: "Array has a fixed compile-time length and is a value type (copied on assignment). A slice is a header {ptr,len,cap} over an array, reference-like, dynamically resizable via append." },
  { cat: "Go Basics", q: "How do you copy a slice safely?",
    a: "Use the built-in `copy(dst, src)` which copies min(len(dst), len(src)) elements. To clone: `dst := append([]T(nil), src...)` or `slices.Clone` (Go 1.21+)." },
  { cat: "Go Basics", q: "What happens when you read from a nil map vs write to it?",
    a: "Read returns the zero value silently. Write panics with 'assignment to entry in nil map'. Always initialize maps with `make` or a literal before writing." },
  { cat: "Go Basics", q: "What is a rune in Go?",
    a: "An alias for int32 representing a Unicode code point. Use it when iterating strings character-by-character: `for i, r := range s` yields rune r at byte index i." },
  { cat: "Go Basics", q: "Why is `len(s)` byte length, not character count, for strings?",
    a: "Strings are immutable byte sequences (typically UTF-8). `len(s)` is bytes. For character count use `utf8.RuneCountInString(s)` or range over the string." },
  { cat: "Go Basics", q: "What does `init()` do? When does it run?",
    a: "Each file may declare init(); they run after package-level variable init, before main(). Order: imported packages first, then top-to-bottom within a package. Avoid heavy work or panics there." },
  { cat: "Go Basics", q: "What's the difference between `==` on structs vs slices vs maps?",
    a: "Structs are comparable if all fields are. Slices, maps, functions are NOT comparable (compile error or always-nil compare). Use reflect.DeepEqual or slices.Equal/maps.Equal." },
  { cat: "Go Basics", q: "What does the blank identifier `_` do?",
    a: "Discards a value: ignore return values, satisfy multi-return signatures, force compile-time interface assertion (`var _ I = (*T)(nil)`), or import for side-effects (`import _ \"foo\"`)." },
  { cat: "Go Basics", q: "What is shadowing and why is it dangerous?",
    a: "A new variable hides an outer one in an inner scope (often via `:=`). Common bug: `if err := f(); err != nil { ... }`—but doing `x, err := g()` re-declares err in the inner block, hiding outer err." },
  { cat: "Go Basics", q: "What does `go vet` catch that the compiler doesn't?",
    a: "Suspicious constructs: printf format mismatches, copying mutex by value, unreachable code, shadowed vars, struct tag typos. Run in CI." },

  // ----- Go Advanced (more) -----
  { cat: "Go Advanced", q: "What are Go generics constraints?",
    a: "Interfaces used as type sets restrict allowed type arguments, e.g. `[T constraints.Ordered]` or `[T any]`. Built-in `comparable` requires == support. Define your own with type union: `interface{ int|float64 }`." },
  { cat: "Go Advanced", q: "How does reflection work in Go?",
    a: "reflect.TypeOf/ValueOf inspect type & value at runtime. Use sparingly—slow, loses compile-time safety. Common uses: JSON/SQL marshalers, dependency injection." },
  { cat: "Go Advanced", q: "What is the difference between `any` and `interface{}`?",
    a: "Aliases of each other since Go 1.18. `any` is the preferred spelling. Both mean 'value of any type' (an interface with no methods)." },
  { cat: "Go Advanced", q: "Why prefer `errors.New` vs `fmt.Errorf` vs custom error types?",
    a: "errors.New for static messages. fmt.Errorf with %w to wrap. Custom error type (struct implementing Error()) when callers must inspect fields (errors.As)." },
  { cat: "Go Advanced", q: "What's the cost of using `interface{}` in hot paths?",
    a: "Boxing: value escapes to heap, allocation + GC pressure. Method dispatch is virtual (itab lookup). Prefer concrete types or generics in hot code." },
  { cat: "Go Advanced", q: "How does `panic`/`recover` work?",
    a: "panic unwinds the stack running deferred functions. recover called from a deferred fn returns the panic value and stops unwinding. Use only at goroutine boundaries (e.g. HTTP middleware), not for control flow." },
  { cat: "Go Advanced", q: "What is `unsafe.Pointer` allowed to do?",
    a: "Convert between any pointer types, pointer↔uintptr (carefully). Used for zero-copy reinterpretation, struct field offsets. Breaks type safety—reserved for stdlib/perf code." },
  { cat: "Go Advanced", q: "How do you profile a Go program?",
    a: "Import net/http/pprof (HTTP) or runtime/pprof (file). Endpoints: /debug/pprof/{profile,heap,goroutine,block,mutex,trace}. Analyze with `go tool pprof` and `go tool trace`." },
  { cat: "Go Advanced", q: "What is the difference between embedded interface and embedded struct?",
    a: "Embedded interface: the outer type must satisfy that interface; methods are promoted, but the receiver is the interface value. Embedded struct: fields & methods are promoted with the outer struct as receiver." },
  { cat: "Go Advanced", q: "What does `runtime.GOMAXPROCS` control?",
    a: "Maximum number of OS threads that can execute Go code simultaneously (the P count in GMP). Defaults to NumCPU. Container-aware via automaxprocs to read cgroup limits." },

  // ----- Concurrency (more) -----
  { cat: "Concurrency", q: "What is happens-before in the Go memory model?",
    a: "A partial ordering of memory ops. Synchronization (channel send/recv, sync primitives, sync/atomic) establishes happens-before edges. Without one, reads may see stale values." },
  { cat: "Concurrency", q: "Why is `sync.Once` useful?",
    a: "Guarantees a function runs exactly once across goroutines, with proper memory ordering. Common for lazy initialization of singletons, connection pools." },
  { cat: "Concurrency", q: "When should you use `sync/atomic`?",
    a: "Counters, flags, and simple cas-loops where a mutex would be overkill. Pair reads & writes consistently with atomic ops; mixing atomic + non-atomic on same var is undefined." },
  { cat: "Concurrency", q: "Pattern: pipeline.",
    a: "Stages connected by channels; each stage runs in its own goroutine, reads from in-chan, writes to out-chan, closes out-chan when done. Cancellation via shared context." },
  { cat: "Concurrency", q: "Pattern: worker pool with bounded concurrency.",
    a: "Create N worker goroutines reading jobs from a channel; producer sends jobs and closes the channel; workers exit when channel drains. Limits concurrency without per-job goroutine cost." },
  { cat: "Concurrency", q: "What is a `select` with default for?",
    a: "Non-blocking channel ops. default runs immediately if no other case is ready. Useful for try-send/try-recv and timeouts (with time.After case)." },
  { cat: "Concurrency", q: "Why can `time.After` leak in long-running selects?",
    a: "Each call allocates a Timer that fires later. If the select loop iterates often, timers pile up until they fire. Use time.NewTimer + Stop() + Reset() in hot loops." },
  { cat: "Concurrency", q: "What does closing a channel signal?",
    a: "Sender announces no more values will be sent. Receivers see ok=false and zero value after the channel drains. Close exactly once, only by the sender side." },
  { cat: "Concurrency", q: "How do you implement a semaphore in Go?",
    a: "Buffered channel of capacity N used as token store: send to acquire, receive to release. Or use golang.org/x/sync/semaphore.NewWeighted for weighted semantics." },
  { cat: "Concurrency", q: "What does the race detector NOT catch?",
    a: "Races on memory not accessed during the run, races behind unsafe.Pointer, or logic bugs that aren't races (deadlocks, incorrect synchronization). It only reports what it observed." },
  { cat: "Concurrency", q: "Why is `range over channel` idiomatic?",
    a: "`for v := range ch` keeps reading until the channel is closed and drained. Cleanly terminates pipelines; pairs naturally with `close(ch)` by the producer." },
  { cat: "Concurrency", q: "Difference between `context.WithCancel` and `context.WithTimeout`?",
    a: "WithCancel: cancellation only when cancel() is called. WithTimeout/WithDeadline: also cancels automatically after the deadline. Always defer cancel() to release resources." },

  // ----- Memory & GC (more) -----
  { cat: "Memory & GC", q: "What is GOGC and how do you tune it?",
    a: "GOGC=100 (default) triggers GC when heap doubles since last cycle. Lower (50) → more frequent GC, smaller heap, more CPU. Higher (200) → less frequent, larger heap. Tune by measuring p99 + RSS." },
  { cat: "Memory & GC", q: "What is GOMEMLIMIT?",
    a: "Soft memory limit added in Go 1.19. Triggers GC earlier when approaching the limit, reducing OOMs in containerized environments. Set near container memory minus headroom." },
  { cat: "Memory & GC", q: "How do you reduce allocations?",
    a: "Reuse buffers via sync.Pool; preallocate slices/maps with capacity; avoid interface boxing in hot paths; pass pointers for large structs; use strings.Builder instead of += concatenation." },
  { cat: "Memory & GC", q: "What is `sync.Pool` and when does it leak?",
    a: "Per-P pool of reusable objects. Items can be evicted at any GC. Don't use for connections/resources requiring explicit close. Reset object state on Put." },
  { cat: "Memory & GC", q: "Why might `pprof` show high `runtime.mallocgc`?",
    a: "Heavy allocation pressure. Look at heap profile to find culprits. Common causes: string concatenation in loops, interface{}-laden APIs, fmt.Sprintf in hot paths, slice growth without preallocation." },

  // ----- Patterns: more -----
  { cat: "Patterns", q: "Binary search on answer — when to use?",
    a: "When the answer is a number and you have a monotonic predicate P(x): P(x) implies P(x+1). E.g. min capacity to ship in D days, min eating speed Koko, split array largest sum. Binary search the range, evaluate P." },
  { cat: "Patterns", q: "Prefix sum + hashmap — classic problem?",
    a: "Subarray sum equals K. Track sum[i]; for each i, check if (sum[i]-K) exists in the map of seen prefix sums. O(n)." },
  { cat: "Patterns", q: "Monotonic deque — classic problem?",
    a: "Sliding window maximum: deque stores indices in decreasing value order; pop from back when smaller arrives, pop from front when out of window; front is the max in O(1)." },
  { cat: "Patterns", q: "How to detect a duplicate in [1..n] with O(1) space?",
    a: "Linked-list cycle technique on a[] viewed as f(i)=a[i]. Floyd's tortoise & hare finds cycle entry = duplicate. O(n) time, O(1) space." },
  { cat: "Patterns", q: "Merge K sorted lists — best approach?",
    a: "Min-heap of size K with the head of each list. Pop the smallest, advance its list, push next. O(N log K). Or divide & conquer pairwise merge — same complexity, better cache behavior." },
  { cat: "Patterns", q: "Reverse linked list in groups of K?",
    a: "Count K nodes; if fewer remain, return head unchanged. Reverse the K-node window iteratively; recursively process the rest; connect tail.Next = recurse(next)." },
  { cat: "Patterns", q: "Boyer-Moore majority vote?",
    a: "Single-pass O(n)/O(1) for finding an element appearing > n/2 times. Maintain candidate + count; on match count++, else count--; reset candidate when count==0. Verify with second pass if not guaranteed." },
  { cat: "Patterns", q: "Difference array technique?",
    a: "For multiple range updates +v on [l,r], use diff[l]+=v, diff[r+1]-=v; final array = prefix sum of diff. O(N+Q) instead of O(NQ)." },
  { cat: "Patterns", q: "Sweep line for intervals?",
    a: "Convert intervals to events (start=+1, end=-1), sort by time, sweep accumulating active count. Solves max overlap, min meeting rooms, skyline (with heap)." },
  { cat: "Patterns", q: "Best Time to Buy and Sell Stock (1 transaction)?",
    a: "Track min price seen so far; at each day, update best = max(best, price - min). O(n) / O(1)." },
  { cat: "Patterns", q: "Top-K frequent elements in O(n)?",
    a: "Bucket sort by frequency: build freq map, then for each freq put elements into bucket[freq]; iterate buckets from high to low collecting K elements. O(n) vs heap's O(n log k)." },
  { cat: "Patterns", q: "Trie + DFS use case?",
    a: "Word Search II / boggle: insert dictionary into trie; DFS the board following trie nodes; prune branches that don't exist in the trie. Much faster than per-word DFS." },
  { cat: "Patterns", q: "Find articulation points / bridges?",
    a: "Tarjan's DFS with `disc[u]` and `low[u]`. u is articulation if (root with ≥2 children) or (non-root with a child v where low[v] ≥ disc[u]). (u,v) is a bridge if low[v] > disc[u]." },
  { cat: "Patterns", q: "Strongly connected components?",
    a: "Tarjan's SCC: single DFS with disc/low and a stack; pop SCC when low[u]==disc[u]. Alternative: Kosaraju (two DFS passes on G and reversed G)." },
  { cat: "Patterns", q: "Bipartite check?",
    a: "BFS/DFS color in 2 colors; if an edge connects same-colored nodes, not bipartite. Useful for matching, scheduling, conflict graphs." },
  { cat: "Patterns", q: "Number of islands variants?",
    a: "DFS/BFS flood-fill, marking visited. Variants: count islands, max area, surrounded regions (mark border-connected first), as-far-from-land (multi-source BFS from all lands)." },
  { cat: "Patterns", q: "Reservoir sampling for k items from a stream?",
    a: "Keep first k items. For i>=k, pick a random index j in [0, i]; if j<k, replace reservoir[j] with item. Uniform sampling without knowing stream length." },
  { cat: "Patterns", q: "Two-pointer template for sorted-array three-sum?",
    a: "Sort; for each i, two-pointer on [i+1..n-1] for target = -a[i]; skip duplicates at every level. O(n²)." },

  // ----- DP (more) -----
  { cat: "DP", q: "Longest Common Subsequence recurrence?",
    a: "dp[i][j]=dp[i-1][j-1]+1 if s1[i-1]==s2[j-1], else max(dp[i-1][j], dp[i][j-1]). O(mn) time, can be rolled to O(min(m,n)) space." },
  { cat: "DP", q: "Matrix Chain Multiplication?",
    a: "Interval DP: dp[i][j] = min over k in [i..j-1] of dp[i][k]+dp[k+1][j]+p[i-1]*p[k]*p[j]. O(n³)." },
  { cat: "DP", q: "Bitmask DP — when?",
    a: "n ≤ 20 with 'subset' or 'state of visited items' semantics. Travelling Salesman: dp[mask][i] = min cost to visit set mask ending at i. O(2ⁿ · n²)." },
  { cat: "DP", q: "Digit DP — what does it solve?",
    a: "Count/derive properties of numbers in [L,R] satisfying digit constraints. State: (position, tight, leading_zero, extra). Memoize over non-tight states." },
  { cat: "DP", q: "Tree DP — pattern?",
    a: "DFS post-order; combine children's results into parent's. Classic: max path sum, diameter, count subtrees with property, rerooting techniques for 'answer for every node as root'." },
  { cat: "DP", q: "Knapsack vs Coin Change differences?",
    a: "0/1 knapsack: each item once, reverse-loop capacity. Unbounded knapsack / coin change: unlimited copies, forward-loop capacity. Coin Change II counts ways (sum over coins outer)." },
  { cat: "DP", q: "Why bottom-up over memoization?",
    a: "Avoids recursion overhead and stack overflow on deep states; cache-friendly iteration; easier to roll into 1D. Memoization is more natural when the state space is sparse." },
  { cat: "DP", q: "Palindromic Substrings — efficient approach?",
    a: "Expand around center: 2n-1 centers, each expanded in O(n) total O(n²). Or Manacher's algorithm for true O(n). DP table is O(n²) time AND space." },

  // ----- System Design (more) -----
  { cat: "System Design", q: "PACELC theorem?",
    a: "Extension of CAP. If Partition → trade Consistency/Availability. Else → trade Latency/Consistency. Captures normal-mode trade-offs missed by CAP." },
  { cat: "System Design", q: "Quorum reads/writes — how to get strong consistency?",
    a: "Choose R + W > N. Common: N=3, W=2, R=2. Writes must reach W replicas, reads see at least one with the latest. Used by Dynamo, Cassandra (tunable per query)." },
  { cat: "System Design", q: "Sharding strategies?",
    a: "Range-based (good for range scans, hot-spot risk), hash-based (uniform load, no range queries), geographic (latency, regulatory), or directory-based (lookup service). Pick the shard key carefully — it's the hardest to change later." },
  { cat: "System Design", q: "Hot partition mitigation?",
    a: "Add randomized prefix to shard key; cache hot keys at edge; split the partition; introduce a write buffer; use a different DB family (KV) for the hot path." },
  { cat: "System Design", q: "What is a Bloom filter?",
    a: "Probabilistic set membership: k hashes set bits in a bitmap; query returns 'maybe' or 'definitely not'. No false negatives, tunable false positives. Used in DBs to skip disk reads (LevelDB/RocksDB)." },
  { cat: "System Design", q: "What is a Count-Min Sketch?",
    a: "Probabilistic frequency estimation with bounded overestimate. d hash functions × w counters; increment all, query = min over rows. Used for heavy-hitter / streaming top-K." },
  { cat: "System Design", q: "What is a HyperLogLog?",
    a: "Cardinality (distinct count) estimation with ~1.5KB for billions of items, ~1% error. Used in Redis PFCOUNT, analytics dashboards." },
  { cat: "System Design", q: "LSM tree vs B-tree?",
    a: "B-tree: in-place writes, good reads, mediocre writes (random I/O). LSM: writes buffered in memtable, flushed sorted to SSTables, compacted; great writes, reads use bloom filters + tiered SSTables. RocksDB/LevelDB/Cassandra use LSM." },
  { cat: "System Design", q: "CRDT — what & why?",
    a: "Conflict-free Replicated Data Types: operations commute & merge deterministically without coordination. Used in collaborative editing, offline-first apps, multi-region writes." },
  { cat: "System Design", q: "What is Raft in one paragraph?",
    a: "Consensus protocol: elected leader replicates log entries; followers ack; entry committed when majority acks. Re-elects on heartbeat timeout. Used by etcd, Consul, CockroachDB." },
  { cat: "System Design", q: "What is gossip protocol?",
    a: "Each node periodically picks a random peer and exchanges state. Spreads info in O(log N) rounds with low coordination cost. Used in Cassandra, Consul, Dynamo for cluster membership/failure detection." },
  { cat: "System Design", q: "Vector clocks vs Lamport timestamps?",
    a: "Lamport: single counter per node, gives a total order but loses concurrency info. Vector: per-node array; can detect concurrent updates (incomparable vectors). Trade-off: space O(N) per event." },
  { cat: "System Design", q: "How to design a notification system?",
    a: "Producer → queue → fan-out worker per channel (push/SMS/email); per-user prefs lookup; retry with backoff; DLQ; rate-limit per user; trackable IDs for dedup." },
  { cat: "System Design", q: "How to design a payment system?",
    a: "Idempotency keys on every write; double-entry ledger (debit + credit always sum to zero); sagas for cross-service flows; eventual consistency w/ reconciliation jobs; PCI scope minimization via tokenization." },
  { cat: "System Design", q: "Why is back-of-the-envelope math important in interviews?",
    a: "Signals senior judgment: justifies architecture choices, sizes infra/cost, surfaces hot paths early. Without numbers, designs are unfalsifiable." },
  { cat: "System Design", q: "What is 'tail at scale' and how to fight it?",
    a: "p99 latency dominates user experience as fan-out grows (Dean & Barroso). Mitigations: hedged requests, tied requests, micro-partitioning, request canceling, prioritized queues." },
  { cat: "System Design", q: "What is the circuit breaker pattern?",
    a: "Wrap a remote call; track failures over a window; OPEN state rejects calls fast for a cool-down; HALF-OPEN probes; CLOSE on success. Prevents cascading failures." },
  { cat: "System Design", q: "What is bulkhead isolation?",
    a: "Isolate resource pools (threads, connections, semaphores) per dependency, so one slow downstream can't exhaust the whole service. Inspired by ship compartments." },
  { cat: "System Design", q: "What's the difference between availability and reliability?",
    a: "Availability = % time the system is up. Reliability = probability the system works correctly over time (MTBF). High availability ≠ correctness; a service can be up but returning wrong data." },
  { cat: "System Design", q: "What is SSE vs WebSocket vs long-polling?",
    a: "Long-polling: client waits, server holds, replies. SSE: HTTP one-way server→client stream, auto-reconnect. WebSocket: full-duplex over upgraded TCP. SSE = notifications; WS = chat/games." },
  { cat: "System Design", q: "Backpressure vs load shedding?",
    a: "Backpressure: slow producers when consumers lag (bounded queues, blocking sends). Load shedding: drop requests over capacity (return 503, prioritize critical traffic). Use both." },

  // ----- Databases -----
  { cat: "Databases", q: "Transaction isolation levels?",
    a: "Read uncommitted < Read committed < Repeatable read < Snapshot < Serializable. Each prevents more anomalies (dirty/non-repeatable/phantom/write-skew) at higher cost." },
  { cat: "Databases", q: "What is MVCC?",
    a: "Multi-Version Concurrency Control: writes create new row versions; readers see a consistent snapshot without locks. Postgres, MySQL InnoDB, Oracle. Trade-off: vacuum/compaction overhead." },
  { cat: "Databases", q: "Covering index vs regular index?",
    a: "A covering index contains all columns needed by the query, so the engine answers from the index alone (no row fetch). Speeds up reads at cost of write overhead and storage." },
  { cat: "Databases", q: "When does an index NOT help?",
    a: "Low cardinality columns, leading wildcard LIKE '%x', functions on indexed columns (unless functional index), large result sets (full scan cheaper), small tables." },
  { cat: "Databases", q: "How to scale a relational DB?",
    a: "Vertical first; then read replicas for read scale; then sharding by tenant/region; functional split (separate services); CQRS read models for heavy queries; caching layer." },
  { cat: "Databases", q: "What is connection pooling and why mandatory in Go?",
    a: "Reusing TCP+auth-established DB connections. database/sql includes a pool; tune MaxOpenConns, MaxIdleConns, ConnMaxLifetime. Without it, every query pays handshake cost & may exhaust DB limits." },

  // ----- Caching -----
  { cat: "Caching", q: "Cache stampede — what & mitigations?",
    a: "Many concurrent requests miss the cache after a key expires, hammering the DB. Mitigations: singleflight, jittered TTLs, probabilistic early expiration (XFetch), pre-warming." },
  { cat: "Caching", q: "Cache-aside vs read-through?",
    a: "Cache-aside: app checks cache, on miss fetches DB and fills cache. Read-through: cache library encapsulates this. Cache-aside is more common in Go due to fine-grained control." },
  { cat: "Caching", q: "How to invalidate caches?",
    a: "TTL (simplest, allows staleness); event-driven (publish change → invalidate); write-through (synchronous update); versioned keys (myobj:v42 — bump version on change)." },
  { cat: "Caching", q: "What is a 'thundering herd' on cold start?",
    a: "After deploy/restart, cache is empty; all traffic hits the DB simultaneously. Fix: warm-up scripts, gradual traffic shift, request coalescing, deploy with previous cache snapshot." },

  // ----- Messaging -----
  { cat: "Messaging", q: "Why must consumers be idempotent on at-least-once?",
    a: "Retries (broker, network) may deliver the same message twice. Idempotent handlers (dedup store keyed by msg ID) ensure 'process exactly once' effect even with at-least-once delivery." },
  { cat: "Messaging", q: "How to preserve order in Kafka?",
    a: "Order is guaranteed within a partition. Pick a partition key that groups all related events (e.g. user_id). Single consumer per partition. Accept that global ordering across partitions is not possible." },
  { cat: "Messaging", q: "Outbox vs CDC — when to use which?",
    a: "Outbox: app writes events to a table inside its DB tx; relay publishes. CDC: read binlog/WAL directly (Debezium). CDC works for legacy apps without code changes; outbox is more explicit and DB-agnostic." },

  // ----- Behavioral / Senior -----
  { cat: "Behavioral", q: "STAR(R) framework?",
    a: "Situation (15s context), Task (15s your role), Action (60s decisions/trade-offs you made), Result (30s quantified impact), Reflection (15s what you'd change). Spend most time in Action." },
  { cat: "Behavioral", q: "How to talk about a failure?",
    a: "Pick a substantive failure, own it in first person ('I underestimated...'), spend half the answer on what you changed afterward (process, design review, runbooks). Avoid blaming others." },
  { cat: "Behavioral", q: "Signal for 'senior' vs 'staff' bar?",
    a: "Senior: ships complex features, mentors juniors, owns a service. Staff+: drives multi-quarter cross-team initiatives, sets technical direction, multiplies others, navigates ambiguity, ties work to business outcomes." },
  { cat: "Behavioral", q: "Best questions to ask interviewers?",
    a: "Specific & forward-looking: 'What's the hardest problem this quarter?', '30/60/90-day success criteria?', 'How are post-mortems run?'. Avoid 'what's the culture like?'—signals unprepared." },

  // ----- Last-minute trivia -----
  { cat: "Patterns", q: "When does Quickselect degrade?",
    a: "Sorted or reverse-sorted input with naive pivot → O(n²). Mitigations: randomized pivot, median-of-three, or median-of-medians (deterministic O(n) but high constant)." },
  { cat: "Patterns", q: "When does BFS use more memory than DFS?",
    a: "Wide graphs/trees: BFS holds an entire frontier (up to O(branching^depth/2)). DFS uses O(depth) stack. Use DFS when graph is deep and narrow, BFS when shortest-path-in-edges matters." },
  { cat: "Patterns", q: "Why use iterative DFS over recursion in interviews?",
    a: "Avoids stack overflow on deep graphs (n ≥ 10^4). Same time complexity, slightly more code. Explicitly carry state on the stack." },
  { cat: "Patterns", q: "Catalan numbers — where do they show up?",
    a: "Counting valid parens, unique BSTs of n nodes, triangulations of polygon, Dyck paths. Cₙ = (2n)! / ((n+1)! n!) ≈ 4ⁿ/(n^1.5 √π)." },
  { cat: "Patterns", q: "Fast modular exponentiation?",
    a: "Binary exponentiation: pow(a,b,m) — loop while b>0; if b&1 multiply; square a, halve b. O(log b) modular multiplications. Essential for RSA, hashing, modular DP." },
];

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

const STATE = {
  cards: FLASHCARDS.slice(),
  idx: 0,
  flipped: false,
  knownKey: "fc:known",
  known: new Set(JSON.parse(localStorage.getItem("fc:known") || "[]")),
};

function persistKnown() {
  localStorage.setItem(STATE.knownKey, JSON.stringify([...STATE.known]));
}

function applyFilter() {
  const cat = document.getElementById("fc-cat").value;
  const hideKnown = document.getElementById("fc-hide-known").checked;
  let pool = FLASHCARDS.slice();
  if (cat !== "All") pool = pool.filter(c => c.cat === cat);
  if (hideKnown) pool = pool.filter(c => !STATE.known.has(cardId(c)));
  STATE.cards = pool;
  STATE.idx = 0;
  STATE.flipped = false;
  render();
}

function cardId(c) { return c.cat + "::" + c.q; }

function render() {
  const fc = document.getElementById("flashcard");
  const prog = document.getElementById("fc-progress");
  if (!STATE.cards.length) {
    fc.querySelector(".q").innerText = "🎉 No cards match your filter.";
    fc.querySelector(".a").innerText = "Try clearing 'hide known' or pick another category.";
    prog.innerText = "0 / 0";
    return;
  }
  const c = STATE.cards[STATE.idx];
  fc.classList.toggle("flipped", STATE.flipped);
  fc.querySelector(".face.front .q").innerText = c.q;
  fc.querySelector(".face.front .meta").innerText = c.cat;
  fc.querySelector(".face.back .a").innerText = c.a;
  prog.innerText = `${STATE.idx + 1} / ${STATE.cards.length} • ${STATE.known.size} known`;
}

function nextCard() {
  STATE.idx = (STATE.idx + 1) % STATE.cards.length;
  STATE.flipped = false;
  render();
}
function prevCard() {
  STATE.idx = (STATE.idx - 1 + STATE.cards.length) % STATE.cards.length;
  STATE.flipped = false;
  render();
}
function flip() { STATE.flipped = !STATE.flipped; render(); }
function markKnown() {
  if (!STATE.cards.length) return;
  STATE.known.add(cardId(STATE.cards[STATE.idx]));
  persistKnown();
  applyFilter();
}
function markUnknown() {
  if (!STATE.cards.length) return;
  STATE.known.delete(cardId(STATE.cards[STATE.idx]));
  persistKnown();
  render();
}
function shuffleCards() { shuffle(STATE.cards); STATE.idx = 0; STATE.flipped = false; render(); }
function resetKnown() {
  if (!confirm("Reset all known cards?")) return;
  STATE.known.clear();
  persistKnown();
  applyFilter();
}

function initFlashcards() {
  const cats = ["All", ...new Set(FLASHCARDS.map(c => c.cat))];
  const sel = document.getElementById("fc-cat");
  sel.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join("");
  sel.addEventListener("change", applyFilter);
  document.getElementById("fc-hide-known").addEventListener("change", applyFilter);
  document.getElementById("fc-shuffle").addEventListener("click", shuffleCards);
  document.getElementById("fc-prev").addEventListener("click", prevCard);
  document.getElementById("fc-next").addEventListener("click", nextCard);
  document.getElementById("fc-flip").addEventListener("click", flip);
  document.getElementById("fc-known").addEventListener("click", markKnown);
  document.getElementById("fc-unknown").addEventListener("click", markUnknown);
  document.getElementById("fc-reset").addEventListener("click", resetKnown);
  document.getElementById("flashcard").addEventListener("click", flip);
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
    if (e.key === " ") { e.preventDefault(); flip(); }
    else if (e.key === "ArrowRight") nextCard();
    else if (e.key === "ArrowLeft") prevCard();
    else if (e.key.toLowerCase() === "k") markKnown();
    else if (e.key.toLowerCase() === "u") markUnknown();
    else if (e.key.toLowerCase() === "s") shuffleCards();
  });
  applyFilter();
}

document.addEventListener("DOMContentLoaded", initFlashcards);
