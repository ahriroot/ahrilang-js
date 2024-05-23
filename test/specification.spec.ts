import { expect, test, describe } from 'bun:test'
import { ExprType, Precedence } from '../src/lib'

describe('Precedence', () => {
    test('precedence', () => {
        expect(Precedence.Dot > Precedence.Index).toEqual(true)
        expect(Precedence.Index > Precedence.Call).toEqual(true)
        expect(Precedence.Call > Precedence.Prefix).toEqual(true)
        expect(Precedence.Prefix > Precedence.Power).toEqual(true)
        expect(Precedence.Power > Precedence.Factor).toEqual(true)
        expect(Precedence.Factor > Precedence.Term).toEqual(true)
        expect(Precedence.Term > Precedence.Compare).toEqual(true)
        expect(Precedence.Compare > Precedence.Ternary).toEqual(true)
        expect(Precedence.Ternary > Precedence.Logic).toEqual(true)
        expect(Precedence.Logic > Precedence.Assign).toEqual(true)
        expect(Precedence.Assign > Precedence.Lowest).toEqual(true)
    })
})

describe('ExprType', () => {
    test('exprType', () => {
        expect(ExprType.Postfix > ExprType.Infix).toEqual(true)
        expect(ExprType.Infix > ExprType.Prefix).toEqual(true)
    })
})
