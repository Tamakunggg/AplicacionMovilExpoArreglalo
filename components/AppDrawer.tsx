import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import { Divider, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Elevation } from '../constants/elevation';
import { Spacing } from '../constants/spacing';

export interface DrawerItem {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
  color?: string;
  badge?: string | number;
  danger?: boolean;
}

interface AppDrawerProps {
  visible: boolean;
  onClose: () => void;
  items: DrawerItem[];
  header?: {
    userName?: string;
    userEmail?: string;
    userType?: string;
  };
  footerItems?: DrawerItem[];
}

export const AppDrawer: React.FC<AppDrawerProps> = ({
  visible,
  onClose,
  items,
  header,
  footerItems = [],
}) => {
  const theme = useTheme();
  const slideAnim = React.useRef(new Animated.Value(-Dimensions.get('window').width * 0.75)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -Dimensions.get('window').width * 0.75,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleItemPress = (item: DrawerItem) => {
    item.onPress();
    onClose();
  };

  const drawerWidth = Dimensions.get('window').width * 0.75;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Overlay */}
      <Pressable
        style={[styles.overlay, visible && styles.overlayVisible]}
        onPress={onClose}
      />

      {/* Drawer Content */}
      <Animated.View
        style={[
          styles.drawerContainer,
          {
            width: drawerWidth,
            transform: [{ translateX: slideAnim }],
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <SafeAreaView style={styles.drawer} edges={['top', 'left', 'bottom']}>
          {/* Header */}
          {header && (
            <View style={styles.headerSection}>
              <View style={styles.avatarContainer}>
                <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.avatarText}>
                    {header.userName?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              </View>

              {header.userName && (
                <Text
                  variant="titleMedium"
                  style={[styles.userName, { color: theme.colors.onBackground }]}
                  numberOfLines={1}
                >
                  {header.userName}
                </Text>
              )}

              {header.userType && (
                <Text
                  variant="labelSmall"
                  style={[styles.userType, { color: theme.colors.primary }]}
                >
                  {header.userType}
                </Text>
              )}

              {header.userEmail && (
                <Text
                  variant="bodySmall"
                  style={[styles.userEmail, { color: theme.colors.onSurfaceVariant }]}
                  numberOfLines={1}
                >
                  {header.userEmail}
                </Text>
              )}

              <Divider style={styles.divider} />
            </View>
          )}

          {/* Main Items */}
          <ScrollView
            style={styles.itemsContainer}
            contentContainerStyle={styles.itemsContent}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item, index) => (
              <DrawerItemButton
                key={item.id}
                item={item}
                onPress={() => handleItemPress(item)}
                isLast={index === items.length - 1 && footerItems.length === 0}
              />
            ))}
          </ScrollView>

          {/* Footer Items */}
          {footerItems.length > 0 && (
            <>
              <Divider />
              <View style={styles.footerSection}>
                {footerItems.map((item) => (
                  <DrawerItemButton
                    key={item.id}
                    item={item}
                    onPress={() => handleItemPress(item)}
                  />
                ))}
              </View>
            </>
          )}
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

interface DrawerItemButtonProps {
  item: DrawerItem;
  onPress: () => void;
  isLast?: boolean;
}

const DrawerItemButton: React.FC<DrawerItemButtonProps> = ({
  item,
  onPress,
  isLast = false,
}) => {
  const theme = useTheme();
  const [pressed, setPressed] = React.useState(false);

  const itemColor = item.danger
    ? theme.colors.error
    : item.color || theme.colors.onBackground;

  const itemBgColor = item.danger
    ? theme.colors.errorContainer
    : "#f3f4f6";

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={({ pressed: isPressed }) => [
        styles.drawerItem,
        (isPressed || pressed) && [
          styles.drawerItemPressed,
          { backgroundColor: itemBgColor },
        ],
        !isLast && styles.drawerItemBorder,
      ]}
    >
      <View style={styles.drawerItemContent}>
        <MaterialCommunityIcons
          name={item.icon as any}
          size={24}
          color={itemColor}
          style={styles.drawerItemIcon}
        />
        <Text
          variant="bodyMedium"
          style={[
            styles.drawerItemLabel,
            { color: itemColor },
            item.danger && { fontWeight: '600' },
          ]}
        >
          {item.label}
        </Text>
      </View>
      {item.badge && (
        <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0)',
  },
  overlayVisible: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    height: '100%',
    ...Elevation.level3,
  },
  drawer: {
    flex: 1,
    flexDirection: 'column',
  },
  headerSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'flex-start',
  },
  avatarContainer: {
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  userName: {
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  userType: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  userEmail: {
    marginBottom: Spacing.md,
  },
  divider: {
    marginTop: Spacing.lg,
  },
  itemsContainer: {
    flex: 1,
  },
  itemsContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    borderRadius: 8,
    marginVertical: Spacing.xs,
  },
  drawerItemPressed: {
    opacity: 0.7,
  },
  drawerItemBorder: {
    borderBottomWidth: 0,
  },
  drawerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  drawerItemIcon: {
    marginRight: Spacing.lg,
  },
  drawerItemLabel: {
    flex: 1,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    minWidth: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  footerSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
});

export default AppDrawer;
