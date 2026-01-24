import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface VoiceChatMessage {
  type: 'user' | 'bot' | 'error' | 'products';
  content: string;
  products?: any[];
  orderResponse?: any;
}

interface UiState {
  // Модальные окна
  isAddressMapModalOpen: boolean;
  isStoreMapModalOpen: boolean;
  isCustomizationModalOpen: boolean;
  customizationProductId: string | null;
  
  // Голосовой чат
  isVoiceChatOpen: boolean;
  isRecording: boolean;
  isProcessingVoiceOrder: boolean;
  voiceChatMessages: VoiceChatMessage[];
  voiceTextInput: string;
  
  // Состояния загрузки для конкретных действий
  addingToCartProductId: string | null;
  isCreatingOrder: boolean;
  isSettingAddress: boolean;
  
  // Уведомления/тосты (для будущего расширения)
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  }>;
}

const initialState: UiState = {
  isAddressMapModalOpen: false,
  isStoreMapModalOpen: false,
  isCustomizationModalOpen: false,
  customizationProductId: null,
  
  isVoiceChatOpen: false,
  isRecording: false,
  isProcessingVoiceOrder: false,
  voiceChatMessages: [],
  voiceTextInput: '',
  
  addingToCartProductId: null,
  isCreatingOrder: false,
  isSettingAddress: false,
  
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Модальные окна
    openAddressMapModal: (state) => {
      state.isAddressMapModalOpen = true;
    },
    closeAddressMapModal: (state) => {
      state.isAddressMapModalOpen = false;
    },
    openStoreMapModal: (state) => {
      state.isStoreMapModalOpen = true;
    },
    closeStoreMapModal: (state) => {
      state.isStoreMapModalOpen = false;
    },
    openCustomizationModal: (state, action: PayloadAction<string>) => {
      state.isCustomizationModalOpen = true;
      state.customizationProductId = action.payload;
    },
    closeCustomizationModal: (state) => {
      state.isCustomizationModalOpen = false;
      state.customizationProductId = null;
    },
    
    // Голосовой чат
    openVoiceChat: (state) => {
      state.isVoiceChatOpen = true;
    },
    closeVoiceChat: (state) => {
      state.isVoiceChatOpen = false;
    },
    setRecording: (state, action: PayloadAction<boolean>) => {
      state.isRecording = action.payload;
    },
    setProcessingVoiceOrder: (state, action: PayloadAction<boolean>) => {
      state.isProcessingVoiceOrder = action.payload;
    },
    addVoiceChatMessage: (state, action: PayloadAction<VoiceChatMessage>) => {
      state.voiceChatMessages.push(action.payload);
    },
    clearVoiceChatMessages: (state) => {
      state.voiceChatMessages = [];
    },
    setVoiceTextInput: (state, action: PayloadAction<string>) => {
      state.voiceTextInput = action.payload;
    },
    
    // Состояния загрузки
    setAddingToCartProductId: (state, action: PayloadAction<string | null>) => {
      state.addingToCartProductId = action.payload;
    },
    setCreatingOrder: (state, action: PayloadAction<boolean>) => {
      state.isCreatingOrder = action.payload;
    },
    setSettingAddress: (state, action: PayloadAction<boolean>) => {
      state.isSettingAddress = action.payload;
    },
    
    // Уведомления
    addNotification: (state, action: PayloadAction<Omit<UiState['notifications'][0], 'id'>>) => {
      const id = Date.now().toString();
      state.notifications.push({ id, ...action.payload });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

// Selectors
export const selectIsAddressMapModalOpen = (state: { ui: UiState }) => state.ui.isAddressMapModalOpen;
export const selectIsStoreMapModalOpen = (state: { ui: UiState }) => state.ui.isStoreMapModalOpen;
export const selectIsCustomizationModalOpen = (state: { ui: UiState }) => state.ui.isCustomizationModalOpen;
export const selectCustomizationProductId = (state: { ui: UiState }) => state.ui.customizationProductId;

export const selectIsVoiceChatOpen = (state: { ui: UiState }) => state.ui.isVoiceChatOpen;
export const selectIsRecording = (state: { ui: UiState }) => state.ui.isRecording;
export const selectIsProcessingVoiceOrder = (state: { ui: UiState }) => state.ui.isProcessingVoiceOrder;
export const selectVoiceChatMessages = (state: { ui: UiState }) => state.ui.voiceChatMessages;
export const selectVoiceTextInput = (state: { ui: UiState }) => state.ui.voiceTextInput;

export const selectAddingToCartProductId = (state: { ui: UiState }) => state.ui.addingToCartProductId;
export const selectIsCreatingOrder = (state: { ui: UiState }) => state.ui.isCreatingOrder;
export const selectIsSettingAddress = (state: { ui: UiState }) => state.ui.isSettingAddress;

export const selectNotifications = (state: { ui: UiState }) => state.ui.notifications;

export const {
  openAddressMapModal,
  closeAddressMapModal,
  openStoreMapModal,
  closeStoreMapModal,
  openCustomizationModal,
  closeCustomizationModal,
  openVoiceChat,
  closeVoiceChat,
  setRecording,
  setProcessingVoiceOrder,
  addVoiceChatMessage,
  clearVoiceChatMessages,
  setVoiceTextInput,
  setAddingToCartProductId,
  setCreatingOrder,
  setSettingAddress,
  addNotification,
  removeNotification,
  clearNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;



