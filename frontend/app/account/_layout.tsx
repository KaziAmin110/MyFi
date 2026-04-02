import React, { useEffect, useRef } from "react";
import { Platform, Animated as RNAnimated, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { BottomTabBar, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { TabBarProvider, useTabBar } from "../../components/TabBarContext";

const TabIcon = ({
  name,
  activeName,
  color,
  size,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  activeName: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  focused: boolean;
}) => {
  const scale = useRef(new RNAnimated.Value(focused ? 1.15 : 1)).current;

  useEffect(() => {
    RNAnimated.spring(scale, {
      toValue: focused ? 1.15 : 1,
      damping: 14,
      stiffness: 180,
      useNativeDriver: true,
    }).start();
  }, [focused, scale]);

  const { width } = useWindowDimensions();
  const dynamicSize = Math.min(26, Math.max(20, width * 0.06));

  return (
    <RNAnimated.View style={{ alignItems: "center", transform: [{ scale }] }}>
      <Ionicons
        name={focused ? activeName : name}
        size={dynamicSize}
        color={color}
      />
    </RNAnimated.View>
  );
};

const AnimatedTabBar = (props: BottomTabBarProps) => {
  const { visible } = useTabBar();
  const animValue = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    RNAnimated.spring(animValue, {
      toValue: visible ? 1 : 0,
      damping: 20,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, animValue]);

  return (
    <RNAnimated.View
      style={{
        opacity: animValue,
        transform: [
          {
            translateY: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [100, 0],
            }),
          },
        ],
      }}
    >
      <BottomTabBar {...props} />
    </RNAnimated.View>
  );
};

const TabsLayout = () => {
  const insets = useSafeAreaInsets();
  const isIos = Platform.OS === "ios";
  
  // Compact navbar logic
  const tabHeight = isIos ? (insets.bottom > 0 ? 74 : 64) : 60;
  const bottomPadding = isIos ? (insets.bottom > 0 ? insets.bottom - 12 : 4) : 4;

  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#3059AD",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: "600",
          letterSpacing: 0.1,
          marginTop: -2,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="light"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              overflow: "hidden",
              backgroundColor: "rgba(255, 255, 255, 0.85)",
            }}
          />
        ),
        tabBarStyle: {
          position: "absolute",
          height: tabHeight,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingBottom: bottomPadding,
          paddingTop: 4,
          shadowColor: "#1a2e50",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 16,
          elevation: 12,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name="home-outline"
              activeName="home"
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name="chatbubble-outline"
              activeName="chatbubble"
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="create-reminder"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="edit-reminder"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="assessment"
        options={{
          title: "Results",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name="documents-outline"
              activeName="documents"
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name="person-outline"
              activeName="person"
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="assessmentResult"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="AssessmentSkeleton"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="takeAssessment"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="preAssessment"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="HabitudeReport"
        options={{
          href: null,
          headerShown: false,
          tabBarStyle: {display: "none"},
        }}
      />
    </Tabs>
  );
};

const AccountLayout = () => (
  <TabBarProvider>
    <TabsLayout />
  </TabBarProvider>
);

export default AccountLayout;
