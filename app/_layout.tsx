import React, { useState, useEffect } from 'react';
import { Slot, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Animated, Platform, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Login from './login';
import Register from './register';
import { AuthContext, User } from './auth-context';
import * as NavigationBar from 'expo-navigation-bar';

export default function RootLayout() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewUser, setViewUserState] = useState<User | null>(null);

  const demoClient: User = {
    id: 'u-client',
    name: 'Cliente Demo',
    email: 'cliente@demo.com',
    phone: '55 5555 5555',
    type: 'cliente',
    avatar: undefined,
    rating: 4.6,
    reviews: [
      { id: 'r1', author: 'Profesional A', rating: 5, comment: 'Excelente cliente, pagó a tiempo.' },
      { id: 'r2', author: 'Profesional B', rating: 4, comment: 'Buena comunicación y puntualidad.' },
    ],
  };

  const demoProf: User = {
    id: 'u-prof',
    name: 'Profesionista Demo',
    email: 'prof@demo.com',
    phone: '66 6666 6666',
    type: 'profesionista',
    avatar: undefined,
    specialty: 'Electricista',
    credential: 'CED-123456',
    yearsExp: '8',
    rating: 4.9,
    reviews: [
      { id: 'r1', author: 'Cliente X', rating: 5, comment: 'Trabajo impecable y muy puntual.' },
      { id: 'r2', author: 'Cliente Y', rating: 4, comment: 'Buen trabajo, pero tardó un poco.' },
      { id: 'r3', author: 'Cliente Z', rating: 5, comment: 'Recomendado, muy profesional.' },
      { id: 'r4', author: 'Cliente W', rating: 4, comment: 'Buen resultado, precio justo.' },
      { id: 'r5', author: 'Cliente V', rating: 5, comment: 'Excelente servicio y atención.' },
    ],
  };

  const handleNavigate = (route: string) => {
    if (route === '/register') return setAuthView('register');
    if (route === '/login') return setAuthView('login');
    router.push(route);
  };

  const handleLogin = (user?: User) => {
    setCurrentUser(user ?? demoClient);
    setIsLoggedIn(true);
  };

  const [activeTab, setActiveTab] = useState<'buscar' | 'favoritos' | 'perfil' | 'trabajos'>('buscar');

  useEffect(() => {
    let mounted = true;
    const applyNav = async () => {
      if (!mounted) return;
      try {
        if (Platform.OS === 'android' && NavigationBar && NavigationBar.setVisibilityAsync) {
          // Hide the navigation bar; don't set behavior to avoid edge-to-edge warnings
          await NavigationBar.setVisibilityAsync('hidden');
        }
      } catch (e) {
        // ignore on unsupported platforms or older devices
      }
    };

    applyNav();

    const sub = AppState.addEventListener ? AppState.addEventListener('change', (state) => {
      if (state === 'active') applyNav();
    }) : undefined;

    return () => {
      mounted = false;
      if (sub && typeof sub.remove === 'function') sub.remove();
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/buscar');
      setActiveTab('buscar');
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <>
        <StatusBar style="light" backgroundColor="#0b5fff" />
        <View style={[styles.container, { justifyContent: 'center' }]}>
          {authView === 'login' ? (
            <Login onLogin={(u) => handleLogin(u)} onNavigate={handleNavigate} />
          ) : (
            <Register onRegisterSuccess={() => setAuthView('login')} onNavigate={handleNavigate} />
          )}
        </View>
      </>
    );
  }

  

  return (
    <AuthContext.Provider value={{ logout: () => { setIsLoggedIn(false); setCurrentUser(null); }, user: currentUser, setUser: setCurrentUser, viewUser, setViewUser: (u?: User | null) => { setViewUserState(u ?? null); } }}>
      <View style={styles.container}>
        <StatusBar style="light" backgroundColor="#0b5fff" />
        <SafeAreaView edges={["top"]} style={styles.contentSafe}>
          <View style={styles.content}>
            <Slot />
          </View>
        </SafeAreaView>
        <SafeAreaView edges={["bottom"]} style={styles.navSafeArea} pointerEvents="box-none">
          <View style={styles.navWrapper} pointerEvents="box-none">
            <View style={styles.nav}>
              {/* NavButton provides press animation and active color */}
              <NavButton label="Contratar" route="/buscar" active={activeTab === 'buscar'} onPress={() => { router.push('/buscar'); setActiveTab('buscar'); }} />
              <NavButton label="Trabajos" route="/trabajos" active={activeTab === 'trabajos'} onPress={() => { router.push('/trabajos'); setActiveTab('trabajos'); }} />
              <NavButton label="Favoritos" route="/favoritos" active={activeTab === 'favoritos'} onPress={() => { router.push('/favoritos'); setActiveTab('favoritos'); }} />
              <NavButton label="Perfil" route="/perfil" active={activeTab === 'perfil'} onPress={() => { setViewUserState(null); router.push('/perfil'); setActiveTab('perfil'); }} />
            </View>
          </View>
        </SafeAreaView>
      </View>
    </AuthContext.Provider>
  );
}

function NavButton({ label, onPress, active, route }: { label: string; onPress: () => void; active?: boolean; route?: string }) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[styles.navButton, { transform: [{ scale }] }]}>
      <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={styles.pressableArea}>
        <Text style={[styles.navText, active ? styles.navTextActive : null]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1 },
  navSafeArea: {
    backgroundColor: '#fff',
  },
  navWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  nav: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
    backgroundColor: '#fff',
    width: '100%',
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
  },
  navText: {
    fontSize: 14,
    color: '#333',
  },
  navTextActive: {
    color: '#0b5fff',
    fontWeight: '700',
  },
  pressableArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%'
  },
  contentSafe: { flex: 1 },
});
