#!/usr/bin/env python

"""
    Simulates a battle using each attack option
    ./battle_sim.py [attackradius2]

    attackradius2 is optional, default is 6.

    Map is read in via stdin until EOF or a blank line is encountered.
    Map is automatically padded out to be rectangular.
    Spaces count as LAND.
    Newlines seperate rows but pipes (|) may also be used.
        Pipes are useful for creating one liners:
        ./battle_sim.py <<<"a.b.c||..a"
    Wrapping does not affect the battles.
"""

import sys
import os
import random
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from ants import Ants, MAP_RENDER, PLAYER_CHARS
from math import sqrt

def create_map_data(map_segment, buffer):
    # horizontal buffer
    map_segment = ['.'*buffer + s + '.'*buffer for s in map_segment]

    # vertical buffer
    width = len(map_segment[0])
    map_segment = ['.'*width]*buffer + map_segment + ['.'*width]*buffer
    height = len(map_segment)

    # create the map text
    map_data = []
    map_data.append(['rows', height])
    map_data.append(['cols', width])
    map_data.extend(['m', s] for s in map_segment)
    map_data.append([])

    return '\n'.join(' '.join(map(str,s)) for s in map_data)

def create_map_output(map_grid, buffer):
    # remove vertical buffer
    #map_grid = map_grid[buffer:-buffer]

    # remove horizontal buffer
    #map_grid = [row[buffer:-buffer] for row in map_grid]

    return [''.join(MAP_RENDER[c] for c in row) for row in map_grid]

def simulate_battle(map_segment, attackradius2, attack_method):
    # add buffer so that battles aren't affected by wrapping
    #buffer = int(sqrt(attackradius2)) + 1
    buffer = 0

    map_data = create_map_data(map_segment, buffer)

    game = Ants({
        'attackradius2': attackradius2,
        'map': map_data,
        'attack': attack_method,
        # the rest of these options don't matter
        'loadtime': 0,
        'turntime': 0,
        'viewradius2': 100,
        'spawnradius2': 2,
        'turns': 1
    })
    game.do_attack()

    # remove buffer and return
    return create_map_output(game.map, buffer)

def read_map_segment():
    map_segment = []

    """
    # read from stdin until we get an empty line
    while True:
        line = sys.stdin.readline().rstrip()
        if line:
            map_segment.extend(line.split('|'))
        else:
            break
    """
    line = "...............||||||||||||||" # 15x15 empty map
    map_segment.extend(line.split('|'))

    # normalise
    width = max(map(len,map_segment))
    map_segment = [s.ljust(width).replace(' ','.') for s in map_segment]

    return map_segment

def reset_player_names(before, after):
    after = map(list, after)
    for i, row in enumerate(after):
        for j, value in enumerate(row):
            if value in PLAYER_CHARS:
                after[i][j] = before[i][j]
    return [''.join(s) for s in after]

if __name__ == "__main__":
    attackradius2 = 6
    #if len(sys.argv) > 1:
    #    attackradius2 = int(sys.argv[1])

    map_segment = read_map_segment()

    width = len(map_segment[0])
    height = len(map_segment)
    print "width:%d height:%d" % (width, height)

    # Generate random starting points
    NUM_ALLY = 2
    NUM_ENEMY = 2

    for i in range(0, NUM_ALLY):
        while(True):
            x = random.randint(0, width-1)
            y = random.randint(0, height-1)

            if map_segment[y][x] == '.':
                line = list(map_segment[y])
                line[x] = "a"
                map_segment[y] = "".join(line)
                break;

    for i in range(0, NUM_ENEMY):
        while(True):
            x = random.randint(0, width-1)
            y = random.randint(0, height-1)

            if map_segment[y][x] == '.':
                line = list(map_segment[y])
                line[x] = "b"
                map_segment[y] = "".join(line)
                break;

    print '\n'.join(map_segment)
    sys.exit()

    for method in ['damage']:
        result = simulate_battle(map_segment, attackradius2, method)
        result = reset_player_names(map_segment, result)

        print
        print method + ":"
        print '\n'.join(result)
