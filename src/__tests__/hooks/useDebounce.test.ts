import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

jest.useFakeTimers();

describe('useDebounce', () => {
  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 500 });
    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });

  it('should reset timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 500 } }
    );

    rerender({ value: 'b', delay: 500 });
    act(() => { jest.advanceTimersByTime(200); });
    
    rerender({ value: 'c', delay: 500 });
    act(() => { jest.advanceTimersByTime(200); });
    
    rerender({ value: 'd', delay: 500 });
    act(() => { jest.advanceTimersByTime(200); });

    expect(result.current).toBe('a');

    act(() => { jest.advanceTimersByTime(500); });
    expect(result.current).toBe('d');
  });

  it('should handle different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 1000 } }
    );

    rerender({ value: 'updated', delay: 1000 });
    
    act(() => { jest.advanceTimersByTime(500); });
    expect(result.current).toBe('initial');

    act(() => { jest.advanceTimersByTime(500); });
    expect(result.current).toBe('updated');
  });
});
