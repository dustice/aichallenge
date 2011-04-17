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

    # Figure out what number we labeled each character
    a = 0
    b = 0
    #print game.player_chars
    if 'a' in game.player_chars:
        a = len(game.player_ants(game.player_chars.index('a')))
    if 'b' in game.player_chars:
        b = len(game.player_ants(game.player_chars.index('b')))

    # remove buffer and return
    return (create_map_output(game.map, buffer), (a,b))

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
    #line = "..........|||||||||" # 10x10 empty map
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
    method = 'damage'
    #if len(sys.argv) > 1:
    #    attackradius2 = int(sys.argv[1])

    # Q learning
    # Random start position, enemy plays randomly, episode concludes when one side "wins"
    # Reward equal to (# enemy - # ally) when battle is over
    # Choose epsilon-greedy action

    alpha = 0.1
    gamma = 0.9
    epsilon = 0.02

    avgReward = 0
    kReward = 0

    Q = dict()      # Map from State,Action to Q(s)
    DIRECTIONS = ['n', 's', 'w', 'e']

    while(True):
        # Generate 15x15 blank map
        map_segment = read_map_segment()
        width = len(map_segment[0])
        height = len(map_segment)

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

        """
        print "width:%d height:%d" % (width, height)
        print '\n'.join(map_segment)
        """

        # Repeat until battle is over
        terminated = False
        s = map_segment
        (s, player_ants) = simulate_battle(s, attackradius2, method)

        # Check if we're already in an end state
        if min(player_ants) == 0:
            terminated = True

        while not terminated:
            # Take actions for both sides
            sp = s

            # Take the best action with 1-epsilon probability
            actions = [(x,y) for x in DIRECTIONS for y in DIRECTIONS]
            myAction = random.choice(actions)
            if random.random() > epsilon:
                bestActions = None
                bestQ = None

                for a in actions:
                    state = ''.join(sp)
                    action = ''.join(a)

                    # Default Value = 0
                    if state+action not in Q:
                        Q[state + action] = 0

                    if bestQ == None or Q[state + action] > bestQ:
                        bestActions = [a]
                        bestQ = Q[state+action]
                    elif Q[state + action] == bestQ:
                        bestActions.append(a)

                myAction = random.choice(bestActions)

            enemyAction = random.choice(actions)

            # Simulate orders
            map_data = create_map_data(sp, 0)

            game = Ants({
                'attackradius2': attackradius2,
                'map': map_data,
                'attack': method,
                # the rest of these options don't matter
                'loadtime': 0,
                'turntime': 0,
                'viewradius2': 100,
                'spawnradius2': 2,
                'turns': 1
            })
            a = game.player_chars.index('a')
            b = game.player_chars.index('b')

            """
            Orders must be of the form: o row col direction
            row, col must be integers
            direction must be in (n,s,e,w)
            """

            myOrders = []
            myAnts = game.player_ants(a)
            for i in range(0, len(myAnts)):
                r = myAnts[i].loc[0]
                c = myAnts[i].loc[1]
                d = myAction[i]
                myOrders.append("o %d %d %s\n" % (r, c, d))

            enemyOrders = []
            enemyAnts = game.player_ants(b)
            for i in range(0, len(enemyAnts)):
                r = enemyAnts[i].loc[0]
                c = enemyAnts[i].loc[1]
                d = enemyAction[i]
                enemyOrders.append("o %d %d %s\n" % (r, c, d))

            game.start_turn()
            #print myOrders
            game.do_moves(a, myOrders)
            #print enemyOrders
            game.do_moves(b, enemyOrders)
            game.do_orders()

            sp = create_map_output(game.map, 0)

            # Simulate the battle
            (sp, player_ants) = simulate_battle(sp, attackradius2, method)
            reward = 0

            state = ''.join(s)
            newState = ''.join(sp)
            sa = state + ''.join(myAction)

            if min(player_ants) == 0:
                reward = player_ants[0] - player_ants[1]

                # Track average reward
                #avgReward = avgReward + 1.0/(kReward+1)*(reward-avgReward)
                kReward = kReward+1

                #print reward
                #rstring = "%d %f" % (kReward, avgReward)
                rstring = "%d %d" % (kReward, reward)
                print rstring
                sys.stdout.flush()
                #wait = raw_input('--> ')

                terminated = True

            # TD update

            # Calculate max(a') Q(s',a')
            maxQ = -100
            for a in actions:
                action = ''.join(a)

                # Default Value = 0
                if state+action not in Q:
                    Q[state + action] = 0

                maxQ = max(Q[state + action], maxQ)

            Q[sa] = Q[sa] + alpha*(reward + gamma*maxQ - Q[sa])
            s = sp

            #print
            #print '\n'.join(s)



        """
        result = reset_player_names(map_segment, result)
        print
        print '\n'.join(result)
        print player_ants
        break
        """
