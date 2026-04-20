import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  Animated,
  PanResponder,
  ScrollView,
  Image,
  StyleSheet,
} from "react-native";
import { moderateScale } from "../../utils/scale";

interface HabitDetailModalProps {
  visible: boolean;
  selectedHabit: any;
  onClose: () => void;
  onDismiss?: () => void;
  onAskAiCoach: (title: string) => void;
  height: number;
  insetsBottom: number;
}

export const HabitDetailModal: React.FC<HabitDetailModalProps> = ({
  visible,
  selectedHabit,
  onClose,
  onDismiss,
  onAskAiCoach,
  height,
  insetsBottom,
}) => {
  const modalTranslateY = useRef(new Animated.Value(0)).current;

  // Reset position every time the modal opens
  useEffect(() => {
    if (visible) {
      modalTranslateY.setValue(0);
    }
  }, [visible, modalTranslateY]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        gs.dy > 8 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) modalTranslateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 120 || gs.vy > 0.6) {
          // Fast dismiss — slide the sheet out first, then close
          Animated.timing(modalTranslateY, {
            toValue: 800,
            duration: 220,
            useNativeDriver: true,
          }).start(() => {
            modalTranslateY.setValue(0);
            onClose();
          });
        } else {
          // Not far enough — snap back
          Animated.spring(modalTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onDismiss={onDismiss}
    >
      {/* Dimmed backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Bottom sheet — swipeable */}
      <View style={styles.modalCenter}>
        <Animated.View
          style={[
            styles.habitModal,
            {
              borderColor: selectedHabit?.borderColor || "#ccc",
              transform: [{ translateY: modalTranslateY }],
              height: height * 0.88,
            },
          ]}
        >
          {/* Drag handle — attach pan responder here so scroll still works */}
          <View style={styles.modalDragZone} {...panResponder.panHandlers}>
            <View style={styles.modalDragHandle} />

            {/* Header: [spacer] [Title] [X] */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderSpacer} />
              <Text style={styles.modalTitle}>{selectedHabit?.title}</Text>
              <Pressable
                onPress={onClose}
                style={styles.closePressable}
                hitSlop={12}
              >
                <Text style={styles.closeX}>×</Text>
              </Pressable>
            </View>
          </View>

          {/* Inner border wraps all body content */}
          <View
            style={[
              styles.habitModalInner,
              { borderColor: selectedHabit?.borderColor || "#ccc" },
            ]}
          >
            <ScrollView
              contentContainerStyle={[
                styles.modalBody,
                { paddingBottom: insetsBottom + 20 },
              ]}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* Icon */}
              <Image
                source={selectedHabit?.image}
                style={styles.modalIcon}
                resizeMode="contain"
              />

              {/* Tagline */}
              <Text style={styles.tagLine}>{selectedHabit?.tagLine}</Text>

              <Text style={styles.paragraph}>{selectedHabit?.description}</Text>

              {/* Advantages */}
              <Text style={styles.sectionTitle}>Advantages</Text>
              {selectedHabit?.advantages?.map((a: string, idx: number) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{a}</Text>
                </View>
              ))}

              <View style={styles.sectionDivider} />

              {/* Disadvantages */}
              <Text style={styles.sectionTitle}>Disadvantages</Text>
              {selectedHabit?.disadvantages?.map((d: string, idx: number) => (
                <View key={idx} style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{d}</Text>
                </View>
              ))}

              {/* CTA */}
              <Pressable
                style={[
                  styles.cta,
                  {
                    backgroundColor: selectedHabit?.borderColor || "#3A7DFF",
                  },
                ]}
                onPress={() => onAskAiCoach(selectedHabit?.title)}
              >
                <Text style={styles.ctaText}>Ask AI Coach</Text>
              </Pressable>
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCenter: {
    flex: 1,
    justifyContent: "flex-end",
  },
  habitModal: {
    width: "100%",
    maxHeight: "92%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 0,
  },
  modalDragZone: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalHeaderSpacer: {
    width: 36,
  },
  modalTitle: {
    flex: 1,
    fontSize: moderateScale(22),
    fontWeight: "700",
    color: "#3D3D3D",
    textAlign: "center",
  },
  closePressable: {
    width: 36,
    alignItems: "flex-end",
  },
  closeX: {
    fontSize: 30,
    lineHeight: 32,
    color: "#9A9A9A",
    fontWeight: "300",
  },
  habitModalInner: {
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 0,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    marginHorizontal: 8,
    flexGrow: 1,
    flexShrink: 1,
    overflow: "hidden",
  },
  modalBody: {
    paddingHorizontal: 18,
    paddingTop: 16,
    alignItems: "center",
  },
  modalIcon: {
    width: moderateScale(100),
    height: moderateScale(100),
    marginBottom: 12,
  },
  tagLine: {
    textAlign: "center",
    fontSize: moderateScale(15),
    color: "#6A6A6A",
    fontWeight: "400",
    lineHeight: moderateScale(22),
    marginBottom: 16,
  },
  paragraph: {
    alignSelf: "stretch",
    fontSize: moderateScale(14),
    lineHeight: moderateScale(22),
    color: "#222",
    marginBottom: 18,
    textDecorationColor: "#3A7DFF",
    textDecorationStyle: "solid",
  },
  sectionTitle: {
    alignSelf: "stretch",
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 10,
  },
  sectionDivider: {
    alignSelf: "stretch",
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 12,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    alignSelf: "stretch",
    marginBottom: 8,
  },
  bullet: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(22),
    color: "#3D3D3D",
    marginRight: 6,
    width: 14,
  },
  bulletText: {
    flex: 1,
    fontSize: moderateScale(14),
    lineHeight: moderateScale(22),
    color: "#3D3D3D",
  },
  cta: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 50,
    marginBottom: 8,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: moderateScale(15),
    fontWeight: "700",
  },
});
