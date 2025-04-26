import React from 'react';
import { StyleSheet, ScrollView, Animated, Dimensions } from 'react-native';
import { Modal, Portal, Card, Title, Paragraph, Button } from 'react-native-paper';
import { colors } from '../../theme/theme';
import Icon from 'react-native-vector-icons/Ionicons';

export interface OptionItem {
  label: string;
  onPress: () => void;
  color?: string;
  mode?: 'text' | 'outlined' | 'contained';
  disabled?: boolean;
  icon?: string;
}

interface OptionModalProps {
  visible: boolean;
  title: string;
  message?: string;
  options: OptionItem[];
  cancelText?: string;
  onCancel?: () => void;
  onDismiss?: () => void;
  contentStyle?: object;
  vertical?: boolean;
  icon?: string;
}

const OptionModal: React.FC<OptionModalProps> = ({
  visible,
  title,
  message,
  options = [],
  cancelText = 'Đóng',
  onCancel,
  onDismiss,
  contentStyle,
  vertical = false,
  icon = 'list',
}) => {
  // Animation values
  const [animation] = React.useState(new Animated.Value(0));
  
  // If onCancel is not provided, use onDismiss
  const handleCancel = onCancel || onDismiss || (() => {});
  
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
              <Icon name={icon} size={40} color={colors.primary} style={styles.icon} />
              <Title style={styles.title}>{title}</Title>
              {message && <Paragraph style={styles.message}>{message}</Paragraph>}
            </Card.Content>
            
            <ScrollView style={styles.optionsContainer}>
              <Card.Content style={vertical ? styles.verticalOptions : styles.horizontalOptions}>
                {options.map((option, index) => (
                  <Button
                    key={`option-${index}`}
                    mode={option.mode || 'text'}
                    onPress={() => {
                      option.onPress();
                      if (onDismiss) onDismiss();
                    }}
                    textColor={option.color || colors.primary}
                    style={[
                      styles.optionButton,
                      vertical && styles.verticalButton
                    ]}
                    disabled={option.disabled}
                    labelStyle={styles.buttonLabel}
                    icon={option.icon}
                  >
                    {option.label}
                  </Button>
                ))}
              </Card.Content>
            </ScrollView>
            
            <Card.Actions style={styles.actions}>
              <Button
                mode="outlined"
                onPress={handleCancel}
                style={styles.cancelButton}
                labelStyle={styles.buttonLabel}
              >
                {cancelText}
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
    maxHeight: '80%',
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
  optionsContainer: {
    maxHeight: 300,
  },
  horizontalOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  verticalOptions: {
    paddingVertical: 8,
  },
  optionButton: {
    margin: 6,
    borderRadius: 8,
    elevation: 1,
  },
  verticalButton: {
    width: '100%',
    justifyContent: 'flex-start',
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
  },
  actions: {
    justifyContent: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    minWidth: 120,
    borderRadius: 8,
  },
  buttonLabel: {
    fontWeight: '600',
    fontSize: 15,
  }
});

export default OptionModal;