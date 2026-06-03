import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader, StatusBadge } from './ui';

describe('ui components', () => {
  it('renders a page header with title and subtitle', () => {
    render(<PageHeader title="Dashboard" subtitle="Overview" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('formats status labels by replacing underscores', () => {
    render(<StatusBadge status="CHECKED_IN" />);
    expect(screen.getByText('CHECKED IN')).toBeInTheDocument();
  });
});
