import { describe, it, expect } from 'vitest'
import { initialCalc, pressCalc } from './calcEngine'

const type = (keys, s = initialCalc) => keys.reduce((st, k) => pressCalc(st, k), s)

describe('calculator engine', () => {
  it('types digits', () => {
    expect(type(['1', '2', '3']).display).toBe('123')
  })
  it('adds and equals', () => {
    expect(type(['2', '+', '3', '=']).display).toBe('5')
  })
  it('chains operations', () => {
    expect(type(['2', '+', '3', '+', '4', '=']).display).toBe('9')
  })
  it('subtracts, multiplies, divides', () => {
    expect(type(['9', '-', '4', '=']).display).toBe('5')
    expect(type(['6', '*', '7', '=']).display).toBe('42')
    expect(type(['9', '/', '3', '=']).display).toBe('3')
  })
  it('division by zero shows the Windows message', () => {
    expect(type(['5', '/', '0', '=']).display).toContain('Cannot divide by zero')
  })
  it('repeated equals repeats the last operation', () => {
    expect(type(['2', '+', '3', '=', '=']).display).toBe('8')
  })
  it('percent, sqrt, sqr, inv', () => {
    expect(type(['5', '0', 'pct']).display).toBe('0.5')
    expect(type(['9', 'sqrt']).display).toBe('3')
    expect(type(['4', 'sqr']).display).toBe('16')
    expect(type(['4', 'inv']).display).toBe('0.25')
  })
  it('factorial', () => {
    expect(type(['5', 'fact']).display).toBe('120')
  })
  it('unary ops on floating point', () => {
    expect(type(['.', '5', 'inv']).display).toBe('2')
  })
  it('neg flips sign', () => {
    expect(type(['5', 'neg']).display).toBe('-5')
    expect(type(['5', 'neg', 'neg']).display).toBe('5')
  })
  it('CE clears entry only', () => {
    const s = type(['2', '+', '3', 'CE', '4'])
    expect(s.display).toBe('4')
    expect(s.op).toBe('+')
  })
  it('C resets everything but memory', () => {
    const s = pressCalc(type(['5', 'MS']), 'C')
    expect(s.display).toBe('0')
    expect(s.memory).toBe(5)
  })
  it('memory add / recall', () => {
    const s = type(['5', 'MS', '3', 'M+'])
    expect(s.memory).toBe(8)
    expect(pressCalc(s, 'MR').display).toBe('8')
  })
  it('backspace removes a digit', () => {
    expect(type(['1', '2', 'back']).display).toBe('1')
  })
  it('long decimals round sanely', () => {
    expect(type(['1', '/', '3', '=']).display).toBe('0.3333333333')
  })
  it('scientific: power', () => {
    expect(type(['2', '^', '1', '0', '=']).display).toBe('1024')
  })
  it('scientific: trig uses radians', () => {
    expect(type(['0', 'sin']).display).toBe('0')
  })
})
