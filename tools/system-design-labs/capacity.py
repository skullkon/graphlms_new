#!/usr/bin/env python3
"""Учебная M/M/1: один исполнитель, независимые экспоненциальные интервалы и service time. Числа описывают модель, не мощность компьютера."""
print('Учебная M/M/1: один исполнитель, независимые экспоненциальные интервалы и service time. Числа описывают модель, не мощность компьютера.')

import random
from statistics import mean

for arrival_rate in (50, 80, 90):
    rng = random.Random(42)
    arrived = finished = 0.0
    waits, residence = [], []
    for i in range(200_000):
        arrived += rng.expovariate(arrival_rate)
        service = rng.expovariate(100)
        started = max(arrived, finished)
        finished = started + service
        if i >= 1_000:  # не включаем начальный пустой режим
            waits.append(started - arrived)
            residence.append(finished - arrived)
    ordered = sorted(residence)
    p99 = ordered[int(0.99 * (len(ordered) - 1))]
    print(arrival_rate, 'RPS',
          'queue_ms=', round(1000 * mean(waits), 1),
          'mean_ms=', round(1000 * mean(residence), 1),
          'p99_ms=', round(1000 * p99, 1))
