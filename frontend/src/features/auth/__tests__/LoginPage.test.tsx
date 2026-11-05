import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '../AuthPages';

const mocks = vi.hoisted(() => ({ signIn: vi.fn(), toast: vi.fn() }));
vi.mock('../AuthContext', () => ({ useAuth: () => ({ signIn: mocks.signIn }) }));
vi.mock('../../../hooks/useToast', () => ({ useToast: () => ({ toast: mocks.toast }) }));

describe('LoginPage', () => {
  beforeEach(() => { mocks.signIn.mockReset(); mocks.toast.mockReset(); });

  it('validates and submits the login form', async () => {
    mocks.signIn.mockResolvedValue(undefined);
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('University email'), { target: { value: 'student@example.edu' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'correct-password' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(mocks.signIn).toHaveBeenCalledWith({ email: 'student@example.edu', password: 'correct-password' }));
  });
});
