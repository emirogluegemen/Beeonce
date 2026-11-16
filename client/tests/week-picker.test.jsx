import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { WeekPicker } from '../src/components/Layout';

describe('week navigation', () => {
  it('shows a date range and invokes previous / next callbacks', () => {
    const onChange = vi.fn();
    render(<WeekPicker weekStart="2026-11-16" onChange={onChange} />);
    expect(screen.getByText(/16 Nov/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next week' }));
    expect(onChange).toHaveBeenLastCalledWith('2026-11-23');
    fireEvent.click(screen.getByRole('button', { name: 'Previous week' }));
    expect(onChange).toHaveBeenLastCalledWith('2026-11-09');
  });
});
