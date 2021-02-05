import React from 'react';
import { render, RenderAPI } from '@testing-library/react-native';
import SignIn from '../../pages/SignIn';

let signInPage: RenderAPI;

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));
describe('Page - Sign In', () => {
  beforeEach(() => {
    signInPage = render(<SignIn />);
  });
  it('should contains e-mail/password inputs', () => {
    const { getByPlaceholderText } = signInPage;
    expect(getByPlaceholderText('E-mail')).toBeTruthy();
    expect(getByPlaceholderText('Senha')).toBeTruthy();
  });
});
