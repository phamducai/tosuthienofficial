import React from 'react';
import { StyleSheet, Animated, Dimensions } from 'react-native';
import { Modal, Portal, Button, Card, Title, Paragraph } from 'react-native-paper';
import { colors } from '../../theme/theme';
import Icon from 'react-native-vector-icons/Ionicons';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  cancelColor?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  onDismiss?: () => void;
  dangerous?: boolean;
  contentStyle?: object;
  icon?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  confirmColor,
  cancelColor,
  onConfirm,
  onCancel,
  onDismiss,
  dangerous = false,
  contentStyle,
  icon,
}) => {
  // Animation values
  const [animation] = React.useState(new Animated.Value(0));
  
  // If onCancel is not provided, use onDismiss
  const handleCancel = onCancel || onDismiss || (() => {});
  
  // Determine confirm button color based on dangerous prop
  const defaultConfirmColor = dangerous ? '#f44336' : colors.primary;
  const actualConfirmColor = confirmColor || defaultConfirmColor;

  // Determine icon based on dangerous prop
  const iconName = icon || (dangerous ? 'warning' : 'help-circle');
  const iconColor = dangerous ? '#f44336' : colors.primary;
  
  // Run animation when modal becomes visible
  React.useEffect(() => {
    if (visible) {
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 40
      }).start();
    } else {
      animation.setValue(0);
    }
  }, [visible, animation]);
  
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.container, contentStyle]}
        dismissable={true}
      >
        <Animated.View style={{
          transform: [
            {
              scale: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.9, 1]
              })
            }
          ],
          opacity: animation
        }}>
          <Card style={styles.card}>
            <Card.Content style={styles.content}>
              <Icon name={iconName} size={40} color={iconColor} style={styles.icon} />
              <Title style={styles.title}>{title}</Title>
              <Paragraph style={styles.message}>{message}</Paragraph>
            </Card.Content>
            
            <Card.Actions style={styles.actions}>
              <Button
                mode="text"
                onPress={handleCancel}
                textColor={cancelColor || colors.textLight}
                style={styles.button}
                labelStyle={styles.buttonLabel}
              >
                {cancelText}
              </Button>
              
              <Button
                mode="contained"
                onPress={onConfirm}
                buttonColor={actualConfirmColor}
                textColor="#fff"
                style={[styles.button, styles.confirmButton]}
                labelStyle={styles.buttonLabel}
              >
                {confirmText}
              </Button>
            </Card.Actions>
          </Card>
        </Animated.View>
      </Modal>
    </Portal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginHorizontal: 20,
    maxWidth: width * 0.9,
    alignSelf: 'center',
  },
  card: {
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    backgroundColor: '#fff',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    color: '#333',
  },
  message: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#666',
    lineHeight: 20,
    fontSize: 15,
  },
  actions: {
    justifyContent: 'space-between',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    marginHorizontal: 8,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  confirmButton: {
    minWidth: 120,
    borderRadius: 8,
  },
  buttonLabel: {
    fontWeight: '600',
    fontSize: 15,
  }
});

export default ConfirmModal;