use a.dis.parse
use a.dis.display

a = `
async fn add(a, b) {
    return a / b
}

async fn call(a, b) {
    return await add(a, b)
}
res = call(1, 2)
result = coroutine(res)
print(result)
`

inst = parse(a)
display(inst)

// ================================


async fn compare_with0(a, b) {
    print(b)
    if a > 0 {
        return ">"
    } else if a < 0 {
        return "<"
    } else {
        return "=="
    }
}

res = coroutine(compare_with0(0, 1))

print(res)

// ================================

a = 0

loop {
    a = a + 1
    print(a)
    if a < 10 {
        continue
    }
    break
}

use a.time.sleep as sl
use a.coroutine.sleep

a = 0

while a < 10 {
    print(a)
    await sleep(1000)
    a = a + 1
}

// ======================

a = [1,2+1,[4],5]
print(a)

// ======================

a = 3
l = [1, 2, a]
m = {"a": a, "b": 2, "c": l, l: "list"}
print(a)
print(l)
print(m)
