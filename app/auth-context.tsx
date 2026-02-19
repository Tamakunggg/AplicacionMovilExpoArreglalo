import React from 'react';

export type User = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type: 'cliente' | 'profesionista';
  avatar?: string; // uri
  specialty?: string;
  credential?: string;
  yearsExp?: string;
  rating?: number;
  reviews?: Array<{ id: string; author: string; rating: number; comment: string }>;
  // digital signature (short text) used for contract signatures (not password)
  digitalSignature?: string;
};

type AuthContextType = {
  logout: () => void;
  user?: User | null;
  setUser: (u?: User | null) => void;
  viewUser?: User | null;
  setViewUser?: (u?: User | null) => void;
};

export const AuthContext = React.createContext<AuthContextType>({
  logout: () => {},
  user: null,
  setUser: () => {},
  viewUser: null,
  setViewUser: () => {},
});

export default AuthContext;
