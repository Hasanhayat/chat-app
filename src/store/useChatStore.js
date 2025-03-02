// store/useChatStore.js
import { create } from "zustand";
import { getDatabase, ref, onValue } from "firebase/database"; // Import Realtime Database functions
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  onSnapshot,
  getFirestore,
} from "firebase/firestore";
import toast from "react-hot-toast";

export const useChatStore = create((set) => ({
  messages: [],
  users: [],
  selectedUser :  null,
  onlineUsers: [], // New state for online users
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      set({ users: usersList });
    } catch (error) {
      console.log(error);
      toast.error("Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: (userId) => {
    set({ isMessagesLoading: true });
    const messagesCollection = collection(db, "messages");
    const messagesQuery = query(
      messagesCollection,
      where("receiverId", "==", userId)
    );

    // Real-time updates
    const unsubscribe = onSnapshot(
      messagesQuery,
      (querySnapshot) => {
        const messagesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        set({ messages: messagesList });
        set({ isMessagesLoading: false });
      },
      (error) => {
        toast.error("Failed to load messages");
        set({ isMessagesLoading: false });
      }
    );

    // Return the unsubscribe function to stop listening for updates
    return unsubscribe;
  },

  sendMessage: async (messageData) => {
    const { selectedUser  } = get();
    try {
      await addDoc(collection(db, "messages"), {
        ...messageData,
        receiverId: selectedUser .id, // Assuming selectedUser  has an id
        createdAt: new Date(),
      });
    } catch (error) {
      toast.error("Failed to send message");
    }
  },

  setSelectedUser :  (selectedUser ) => set({ selectedUser  }),

  // New method to get online users
  getOnlineUsers : () => {
    const db = getDatabase();
    const usersRef = ref(db, 'users');

    onValue(usersRef, (snapshot) => {
      const users = snapshot.val();
      const onlineUsers = Object.values(users).filter(user => user.online);
      set({ onlineUsers }); // Update the onlineUsers state
    }, (error) => {
      toast.error("Failed to load online users");
    });
  },
}));