import re
from pathlib import Path

p = Path('apps/web/components/business/BusinessLandingEnhanced.tsx')
s = p.read_text(encoding='utf-8', errors='ignore')

# Remove comments
s = re.sub(r"/\*.*?\*/", "", s, flags=re.S)
s = re.sub(r"//.*", "", s)

# Remove strings
s = re.sub(r"'(?:\\.|[^'\\])*'", "''", s)
s = re.sub(r'"(?:\\.|[^"\\])*"', '""', s)
s = re.sub(r"`(?:\\.|[^`\\])*`", "``", s)

stack = []
pairs = {'(' : ')', '{': '}', '[': ']'}
line = 1
col = 0

for idx, ch in enumerate(s):
    if ch == '\n':
        line += 1
        col = 0
        continue
    col += 1
    if ch in pairs:
        stack.append((ch, line, col))
    elif ch in pairs.values():
        if not stack:
            start = max(0, idx-40)
            end = min(len(s), idx+40)
            print('Unmatched closing', ch, 'at', line, col, 'context:', s[start:end].replace('\n','\\n'))
            break
        op, l, c = stack.pop()
        if pairs[op] != ch:
            start = max(0, idx-40)
            end = min(len(s), idx+40)
            print('Mismatched', op, 'at', l, c, 'with', ch, 'at', line, col, 'context:', s[start:end].replace('\n','\\n'))
            break
else:
    print('OK, stack size', len(stack))
    if stack:
        print('Top of stack', stack[-5:])
