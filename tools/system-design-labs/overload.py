#!/usr/bin/env python3
"""Учебная очередь: fixed offered load, один исполнитель, безопасно отменяемые чтения. Не измеряет реальную отмену SQL или capacity компьютера."""
print('Учебная очередь: fixed offered load, один исполнитель, безопасно отменяемые чтения. Не измеряет реальную отмену SQL или capacity компьютера.')

import heapq
from collections import deque

for queue_limit in (None, 20):
    events = [(i / 80, 1, i) for i in range(640)]
    heapq.heapify(events)
    queue, arrived = deque(), {}
    busy = False
    rejected = expired = completed = useful = peak = 0
    finish_time = 0.0
    while events:
        now, kind, request_id = heapq.heappop(events)
        if kind == 0:  # завершение работы
            busy = False
            completed += 1
            useful += now <= arrived[request_id] + 0.5
            finish_time = now
        else:
            arrived[request_id] = now
            if busy and queue_limit is not None and len(queue) >= queue_limit:
                rejected += 1
            else:
                queue.append(request_id)
                peak = max(peak, len(queue))
        if not busy:
            while queue and now >= arrived[queue[0]] + 0.5:
                queue.popleft()
                expired += 1
            if queue:
                current = queue.popleft()
                service = 0.05 if 2 <= now < 4 else 0.01
                busy = True
                heapq.heappush(events, (now + service, 0, current))
    print('limit=', queue_limit, 'offered=', len(arrived),
          'rejected=', rejected, 'expired_before_start=', expired,
          'completed=', completed, 'useful=', useful,
          'peak_queue=', peak, 'last_completion=', round(finish_time, 3))
