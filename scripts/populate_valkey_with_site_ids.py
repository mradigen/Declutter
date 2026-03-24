import redis
import uuid
import itertools
import time

TOTAL_UUIDS = 50_000_000
BATCH_SIZE = 500_000
PIPELINE_CHUNK = 10_000 # Valkey protocol optimization

def generate_uuids(n):
    for _ in range(n):
        yield str(uuid.uuid4())

def chunked_iterable(iterable, size):
    iterator = iter(iterable)
    while True:
        batch = list(itertools.islice(iterator, size))
        if not batch:
            break
        yield batch

def insert():
    r = redis.Redis(host='localhost', port=6379, decode_responses=True)
    
    print(f"Starting insert of {TOTAL_UUIDS:,} UUIDs...")
    start_time = time.time()
    
    total_inserted = 0
    
    # 1. Outer Loop: Grabs 500k items into memory at a time
    for memory_batch in chunked_iterable(generate_uuids(TOTAL_UUIDS), BATCH_SIZE):
        
        pipe = r.pipeline()

        memory_batch.append('bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb')
        
        # 2. Inner Loop: Splits that 500k into optimal protocol chunks (10k)
        # We do this because sending 500k args in one command can block the server
        for i in range(0, len(memory_batch), PIPELINE_CHUNK):
            sub_chunk = memory_batch[i : i + PIPELINE_CHUNK]
            pipe.sadd("site_ids", *sub_chunk)
            
        # Execute the 500k inserts in one network round-trip
        pipe.execute()
        
        total_inserted += len(memory_batch)
        print(f"Inserted {total_inserted:,} / {TOTAL_UUIDS:,} ...")

    elapsed = time.time() - start_time
    print(f"\nDone! Processed {total_inserted:,} UUIDs in {elapsed:.2f} seconds.")

if __name__ == "__main__":
    insert()
