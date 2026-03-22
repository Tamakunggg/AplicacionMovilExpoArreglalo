import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';
import { Slot, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppDrawer from '../components/AppDrawer';
import { darkTheme, lightTheme } from '../constants/paperTheme';
import { db } from '../firebaseConfig';
import { AuthContext, User } from './auth-context';
import ForgotPassword from './forgot-password';
import Login from './login';
import Register from './register';

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot-password'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewUser, setViewUserState] = useState<User | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'buscar' | 'favoritos' | 'perfil' | 'trabajos'>(
    'buscar'
  );

  const handleNavigate = (route: string) => {
    if (route === '/register') return setAuthView('register');
    if (route === '/login') return setAuthView('login');
    if (route === '/forgot-password') return setAuthView('forgot-password');
    router.push(route as any);
  };

  const handleLogin = async (userAuth?: User) => {
    if (!userAuth || !userAuth.id) {
      setCurrentUser(null);
      setIsLoggedIn(false);
      return;
    }

    setIsLoadingProfile(true);

    try {
      const userDocRef = doc(db, 'usuarios', userAuth.id);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const dbData = userDocSnap.data();

        const fullUserData: User = {
          ...userAuth,
          name:
            dbData.name ||
            (dbData.firstName
              ? `${dbData.firstName} ${dbData.lastName || ''}`.trim()
              : userAuth.name),
          firstName: dbData.firstName,
          lastName: dbData.lastName,
          type: dbData.type,
          specialty: dbData.specialty,
          bio: dbData.bio,
          yearsExp: dbData.yearsExp,
          rating: dbData.rating || 0,
          avatar: dbData.avatar,
          location: dbData.location,
          categories: dbData.categories || [],
          phone: dbData.phone,
          email: dbData.email || userAuth.email,
          digitalSignature: dbData.digitalSignature,
          notificaciones: dbData.notificaciones,
        };

        setCurrentUser(fullUserData);
      } else {
        setCurrentUser(userAuth);
      }

      setIsLoggedIn(true);
    } catch (error) {
      console.error('Error al cargar perfil tras login:', error);
      setCurrentUser(userAuth);
      setIsLoggedIn(true);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const applyNav = async () => {
      if (!mounted) return;

      try {
        if (Platform.OS === 'android' && NavigationBar?.setVisibilityAsync) {
          await NavigationBar.setVisibilityAsync('hidden');
        }
      } catch (e) {
        console.log('No se pudo ocultar navigation bar:', e);
      }
    };

    applyNav();

    const sub = AppState.addEventListener?.('change', (state) => {
      if (state === 'active') applyNav();
    });

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
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (pathname?.startsWith('/buscar')) setActiveTab('buscar');
    else if (
      pathname?.startsWith('/trabajos') ||
      pathname?.startsWith('/trabajosCliente') ||
      pathname?.startsWith('/trabajosProfesional')
    ) {
      setActiveTab('trabajos');
    } else if (pathname?.startsWith('/favoritos')) {
      setActiveTab('favoritos');
    } else if (pathname?.startsWith('/perfil')) {
      setActiveTab('perfil');
    }
  }, [pathname]);

  const goToRoute = (route: '/buscar' | '/trabajos' | '/favoritos' | '/perfil') => {
    if (route === '/perfil') {
      setViewUserState(null);
      setActiveTab('perfil');
      router.push('/perfil');
      return;
    }

    if (route === '/buscar') setActiveTab('buscar');
    if (route === '/trabajos') setActiveTab('trabajos');
    if (route === '/favoritos') setActiveTab('favoritos');

    router.push(route);
  };

  const closeDrawerAndNavigate = (route: string) => {
    setDrawerVisible(false);
    router.push(route as any);
  };

  if (!isLoggedIn) {
    return (
      <PaperProvider theme={theme}>
        <>
          <StatusBar style="light" backgroundColor="#0b5fff" />
          <View style={[styles.container, { justifyContent: 'center' }]}>
            {isLoadingProfile ? (
              <ActivityIndicator size="large" color="#0b5fff" />
            ) : authView === 'login' ? (
              <Login onLogin={(u) => handleLogin(u)} onNavigate={handleNavigate} />
            ) : authView === 'register' ? (
              <Register
                onRegisterSuccess={() => setAuthView('login')}
                onNavigate={handleNavigate}
              />
            ) : (
              <ForgotPassword onNavigate={handleNavigate} />
            )}
          </View>
        </>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <AuthContext.Provider
        value={{
          logout: () => {
            setIsLoggedIn(false);
            setCurrentUser(null);
            setViewUserState(null);
            setDrawerVisible(false);
          },
          user: currentUser,
          setUser: setCurrentUser,
          viewUser,
          setViewUser: (u?: User | null) => {
            setViewUserState(u ?? null);
          },
        }}
      >
        <View style={styles.container}>
          <StatusBar style="light" backgroundColor="#0b5fff" />

          <SafeAreaView edges={['top']} style={styles.headerSafe}>
            <View style={styles.header}>
              <Pressable
                onPress={() => setDrawerVisible(true)}
                style={({ pressed }) => [
                  styles.hamburgerBtn,
                  pressed && styles.hamburgerBtnPressed,
                ]}
              >
                <MaterialCommunityIcons name="menu" size={24} color="#0b5fff" />
              </Pressable>

              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>Arréglalo</Text>
              </View>

              <View style={styles.headerSpace} />
            </View>
          </SafeAreaView>

          <View style={styles.content}>
            <Slot />
          </View>

          <SafeAreaView edges={['bottom']} style={styles.navSafeArea}>
              <View style={styles.nav}>
                <NavButton
                  label="Contratar"
                  active={activeTab === 'buscar'}
                  onPress={() => goToRoute('/buscar')}
                />
                <NavButton
                  label="Trabajos"
                  active={activeTab === 'trabajos'}
                  onPress={() => goToRoute('/trabajos')}
                />
                <NavButton
                  label="Favoritos"
                  active={activeTab === 'favoritos'}
                  onPress={() => goToRoute('/favoritos')}
                />
                <NavButton
                  label="Perfil"
                  active={activeTab === 'perfil'}
                  onPress={() => goToRoute('/perfil')}
                />
              </View>
          </SafeAreaView>

          <AppDrawer
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            header={{
              userName: currentUser?.name || currentUser?.firstName,
              userEmail: currentUser?.email,
              userType: currentUser?.type === 'client' ? 'Cliente' : 'Profesional',
            }}
            items={[
              {
                id: 'profile',
                label: 'Mi Perfil',
                icon: 'account-circle-outline',
                onPress: () => {
                  setDrawerVisible(false);
                  setViewUserState(null);
                  setActiveTab('perfil');
                  router.push('/perfil');
                },
              },
              {
                id: 'jobs',
                label: 'Mis Trabajos',
                icon: 'briefcase-outline',
                onPress: () => {
                  setDrawerVisible(false);
                  setActiveTab('trabajos');
                  router.push('/trabajos');
                },
              },
              {
                id: 'favorites',
                label: 'Favoritos',
                icon: 'heart-outline',
                onPress: () => {
                  setDrawerVisible(false);
                  setActiveTab('favoritos');
                  router.push('/favoritos');
                },
              },
              {
                id: 'settings',
                label: 'Configuración',
                icon: 'cog-outline',
                onPress: () => {
                  closeDrawerAndNavigate('/configuracion');
                },
              },
              {
                id: 'help',
                label: 'Ayuda y Soporte',
                icon: 'help-circle-outline',
                onPress: () => {
                  closeDrawerAndNavigate('/ayuda');
                },
              },
              {
                id: 'about',
                label: 'Acerca de',
                icon: 'information-outline',
                onPress: () => {
                  closeDrawerAndNavigate('/acerca');
                },
              },
            ]}
            footerItems={[
              {
                id: 'logout',
                label: 'Cerrar Sesión',
                icon: 'logout',
                danger: true,
                onPress: () => {
                  setDrawerVisible(false);
                  setIsLoggedIn(false);
                  setCurrentUser(null);
                  setViewUserState(null);
                },
              },
            ]}
          />
        </View>
      </AuthContext.Provider>
    </PaperProvider>
  );
}

function NavButton({
  label,
  onPress,
  active,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.navButton, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.pressableArea}
      >
        <Text style={[styles.navText, active ? styles.navTextActive : null]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerSafe: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hamburgerBtn: {
    padding: 8,
    borderRadius: 8,
    flex: 1,
  },
  hamburgerBtnPressed: {
    backgroundColor: '#f3f4f6',
  },
  logoContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0b5fff',
    letterSpacing: 0.5,
  },
  headerSpace: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  navSafeArea: {
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
  },
  nav: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
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
    height: '100%',
  },
  contentSafe: {
    flex: 1,
  },
});