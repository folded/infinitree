import json
import argparse
import exceptions
import re

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('input', type=argparse.FileType('rbU'), help='input file in dimacs format')
    args = parser.parse_args()

    h = args.input.readline()
    m = re.match(r'p\s+edge\s+([0-9]+)\s+([0-9]+)\s*$', h)
    if m is None:
        raise exceptions.RuntimeError('Not in dimacs edge format')

    n_nodes, n_edges = map(int, m.groups())
    nodes = [None] * n_nodes

    lines = list(args.input)

    for l in lines:
        if l[0] == 'n':
            l = l.split()
            nodes[int(l[1]) - 1] = l[2].replace('id=', '')

    def E(l):
        l = l.split()
        e1 = int(l[1]) - 1
        e2 = int(l[2]) - 1
        w = float(l[3].replace('weight=', ''))
        return (e1, e2), w

    edges = [E(l) for l in lines if l[0] == 'e']

    data = dict(
        nodes=[dict(name=n) for n in nodes],
        edges=[dict(source=k[0], target=k[1], weight=v) for k, v in edges]
    )
    print json.dumps(data)
