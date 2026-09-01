# SRPC Benchmark 1

Now on verserion 4.x.x I run the first benchmark of the framework.

## The aim

SRPC currently uses a thread-per-request execution model, where incoming requests are processed by a fixed number(8) worker thread pool. The aim of this Benchmark is to identify "to what extent does this approach scale?" while I encreasing the number of works.

## Experiment design

The experiment consider the scnario where the procedure called is IO-bound, so each request reaches a server procedure whose work always takes 100ms to complete.
The server was tested with 8 to 1,024 worker threads under 1,000 concurrent k6 virtual users for 60 seconds.

### Machines hardware

**Server side**
- Pocessor:   Sanapdragon(R) X - X126100 - Qualcomm(R) Oryon- (TM) CPU - 8 cores - 2.96 GHz
- RAM:    16.0 GB
- OS: Windows 11 Home

**Client side**
- Pocessor:   Intel(R) Core(TM) i7-2600 CPU @ 3.40GHz
- RAM:    15.0 G
- OS: 24.04.1-Ubuntu

### Tools
- On server side was used [resmon.exe](https://en.wikipedia.org/wiki/Resource_Monitor), allows to monitor CPU utilization and memory.

- On client side was used [xk6 and k6](https://medium.com/@marloh2222/utilizando-m%C3%B3dulos-do-xk6-com-k6-b068263b26e8), allows to monitor Latency and Throughput

### Metrics

- Latency : the end-to-end time observed by the client - from sending the request until receiving the complete response.
- Throughput: the number of requests the server successfully processes per second.
- Memory : amount of physical memory currently in use by the process.
- AVG CPU : process's average CPU utilization over a recent rolling time.

$$
\text{Latency} =
\text{Response completion time} - \text{Request start time}
$$

$$
\text{Throughput (req/s)} =
\frac{\text{Successfully completed requests}}{\text{Elapsed time (seconds)}}
$$


### Establishing a theoretical upper bound

Since each request should take ~100 ms(0.1 s) to complete, So, ignoring all framework/network/scheduling overhead,
we can stabelish for each worker an approximate theoretical value for Throughput of:

During one second, how many 100 ms requests can one worker complete? The answer is: exactly how many 100 ms we have in 1s(1000 ms).
So we have:
$$
\frac{\text{100 ms}}{\text{1000 ms}} = 
\text{10}
$$

Now for one worker we have:

$$
\text{ Throughput}_1 =
\frac{\text{10 (requests)}}{\text{1 s}} = \text{10 (req/s)}
$$

So for W workers we have:

$$
\text{Throughput}_w =
\frac{\text{10 * W (requests)}}{\text{1 s}}
$$

| Workers | Theoretical Throughput capacity |
| ------: | ------------------------------: |
|       8 |                        80 req/s |
|      16 |                       160 req/s |
|      32 |                       320 req/s |
|      64 |                       640 req/s |
|     128 |                     1,280 req/s |
|     256 |                     2,560 req/s |
|     512 |                     5,120 req/s |
|    1024 |                    10,240 req/s |


### Metric collection
In total was taked 40 tries, 5 for each worker thread number. For each try was registred both, server side and client side metrics. 

- In server side the metrics(avg_cpu, memory) was registred by human observing the values of the metrics in resmon.exe interface. Was taked the max value observed doring 1 min, while the server was being bombarded with requests.

- In client side the metrics was all registred by k6. For latency was taked: median, p90,p95 and p99

## Results and analyses

### Througput
### Latency
### AVG CPU
### Memory

## Conclusion and comments
Benchmarks with 1000 concurrent k6 virtual users showed strong scaling up to approximately 256 worker threads. Beyond this point, throughput gains diminished while CPU and memory usage continued to increase.