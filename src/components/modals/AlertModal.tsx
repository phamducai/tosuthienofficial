import React from 'react';
import { StyleSheet, Animated, Dimensions } from 'react-native';
import { Modal, Portal, Button, Card, Title, Paragraph } from 'react-native-paper';
import { colors } from '../../theme/theme';
import Icon from 'react-native-vector-icons/Ionicons';

interface ButtonProps {
  text: string;
  onPress: () => void;
  color?: string;
  mode?: 'text' | 'outlined' | 'contained';
}

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: ButtonProps[];
  cancelable?: boolean;
  onDismiss?: () => void;
  contentStyle?: object;
  type?: 'info' | 'success' | 'warning' | 'error';
}

const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  title,
  message,
  buttons = [],
  cancelable = true,
  onDismiss,
  contentStyle,
  type = 'info',
}) => {
  // Animation values
  const [animation] = React.useState(new Animated.Value(0));
  
  // Default buttons if none provided
  const defaultButtons: ButtonProps[] = buttons.length 
    ? buttons 
    : [{ text: 'OK', onPress: onDismiss || (() => {}), mode: 'contained' }];

  // Icon mapping based on type
  const iconMapping = {
    info: { name: 'information-circle', color: colors.primary },
    success: { name: 'checkmark-circle', color: '#4CAF50' },
    warning: { name: 'warning', color: '#FF9800' },
    error: { name: 'alert-circle', color: '#F44336' }
  };

  // Get icon based on type
  const { name: iconName, color: iconColor } = iconMapping[type];
  
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
        onDismiss={cancelable ? onDismiss : undefined}
        contentContainerStyle={[styles.container, contentStyle]}
        dismissable={cancelable}
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
              {defaultButtons.map((button, index) => (
                <Button
                  key={`button-${index}`}
                  mode={button.mode || 'text'}
                  onPress={button.onPress}
                  textColor={button.color || colors.primary}
                  style={styles.button}
                  labelStyle={styles.buttonLabel}
                >
                  {button.text}
                </Button>
              ))}
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
    justifyContent: 'center',
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    marginHorizontal: 8,
    marginVertical: 8,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  buttonLabel: {
    fontWeight: '600',
    fontSize: 15,
  }
});

export default AlertModal;