import React, { useState, useEffect } from 'react';
import { db } from './lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  X,
  Plus,
  Trash2,
  Check,
  Star,
  Sparkles,
  Phone,
  MapPin,
  Clock,
  CreditCard,
  ChevronRight,
  ShieldAlert,
  Edit2,
  Calendar,
  MessageSquare,
  MessageCircle,
  Send,
  Image as ImageIcon,
  Sun,
  Moon
} from 'lucide-react';
import { Booking, Feedback, GalleryImage, SiteContent, CustomPanel, CustomPanelItem } from './types';
import { defaultContent } from './data/defaultContent';
import { Editable } from './components/Editable';
import { Taskbar } from './components/Taskbar';
import { CustomPanelsSection } from './components/CustomPanels';

export default function App() {
  // --- STATE ---
  const [siteContent, setSiteContent] = useState<SiteContent>(defaultContent);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

  // UI States
  const [editMode, setEditMode] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Theme & Non-Iframe Delete Confirmation States
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('k9_theme') as 'dark' | 'light') || 'dark';
  });
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [publicDeletingImageId, setPublicDeletingImageId] = useState<string | null>(null);

  // WhatsApp / SMS Continuation Modal States
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successMsgDetails, setSuccessMsgDetails] = useState<{
    name: string;
    phone: string;
    location: string;
    dogName: string;
    service: string;
    details: string;
  } | null>(null);

  // Form States
  // Admin Login
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Intake Modal
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [dogNameModal, setDogNameModal] = useState('');
  const [dogBreed, setDogBreed] = useState('');
  const [dogAge, setDogAge] = useState('');
  const [interestModal, setInterestModal] = useState('Boarding');

  // Contact Form
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactLocation, setContactLocation] = useState('');
  const [contactDogName, setContactDogName] = useState('');
  const [contactService, setContactService] = useState('Boarding');
  const [contactMessage, setContactMessage] = useState('');
  const [contactFormMsg, setContactFormMsg] = useState('');
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);

  // Feedback Form
  const [fbFormName, setFbFormName] = useState('');
  const [fbFormService, setFbFormService] = useState('Boarding');
  const [fbFormRating, setFbFormRating] = useState<number>(5);
  const [fbFormText, setFbFormText] = useState('');
  const [fbFormMsg, setFbFormMsg] = useState('');
  const [isFbSubmitting, setIsFbSubmitting] = useState(false);

  // Gallery Manager Form
  const [galleryInputMode, setGalleryInputMode] = useState<'url' | 'file'>('file');
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [galleryFileBase64, setGalleryFileBase64] = useState<string | null>(null);
  const [isGalleryProcessing, setIsGalleryProcessing] = useState<boolean>(false);
  const [galleryError, setGalleryError] = useState<string>("");
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [galleryLabelInput, setGalleryLabelInput] = useState('');
  const [editingImageId, setEditingImageId] = useState<string | null>(null);

  // Admin Credentials and OTP verification states
  const [adminCreds, setAdminCreds] = useState({ username: "PradosBlack9k", password: "blados9k@pra" });
  const [newAdminUser, setNewAdminUser] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [currentAdminPassVerify, setCurrentAdminPassVerify] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [sentOtpCode, setSentOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [credMessage, setCredMessage] = useState("");

  // Logo fallback state
  const [logoLoaded, setLogoLoaded] = useState(true);

  // EmailJS Constants from original page
  const EMAILJS_PUBLIC_KEY: string = "K8d2oCt5E9oOxoriy";
  const EMAILJS_SERVICE_ID  = "service_6g6spms";
  const EMAILJS_TEMPLATE_ID = "template_9mos6fm";
  const OWNER_EMAIL = "blackpradosk9@gmail.com";

  // Apply theme to document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('k9_theme', theme);
  }, [theme]);

  // --- INITIAL DATA FETCHING ---
  useEffect(() => {
    // Check if modal was already submitted or skipped in this session
    const modalSession = sessionStorage.getItem('k9_modal_interacted');
    if (!modalSession) {
      // Auto-open modal after a brief delay
      const timer = setTimeout(() => {
        setIsModalOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Check admin session
    if (sessionStorage.getItem('k9_admin_logged_in') === 'true') {
      setIsAdminLoggedIn(true);
    }
    // Check edit mode session
    if (sessionStorage.getItem('k9_edit_mode_active') === 'true') {
      setEditMode(true);
    }

    const loadAllData = async () => {
      try {
        // 1. Fetch site content document
        const contentDocRef = doc(db, 'content', 'main_page');
        const contentSnapshot = await getDoc(contentDocRef);
        if (contentSnapshot.exists()) {
          setSiteContent(contentSnapshot.data() as SiteContent);
        } else {
          // Document does not exist yet. Let's create it with the default values.
          await setDoc(contentDocRef, defaultContent);
          setSiteContent(defaultContent);
        }

        // 2. Fetch bookings
        const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
        const bookingsData: Booking[] = [];
        bookingsSnapshot.forEach((doc) => {
          bookingsData.push({ id: doc.id, ...doc.data() } as Booking);
        });
        setBookings(bookingsData.reverse()); // Show newest bookings first

        // 3. Fetch feedback
        const feedbackSnapshot = await getDocs(collection(db, 'feedback'));
        const feedbackData: Feedback[] = [];
        feedbackSnapshot.forEach((doc) => {
          feedbackData.push({ id: doc.id, ...doc.data() } as Feedback);
        });
        setFeedbackList(feedbackData.reverse());

        // 4. Fetch gallery images
        const gallerySnapshot = await getDocs(collection(db, 'gallery'));
        const galleryData: GalleryImage[] = [];
        gallerySnapshot.forEach((doc) => {
          galleryData.push({ id: doc.id, ...doc.data() } as GalleryImage);
        });
        setGalleryImages(galleryData);

        // 5. Fetch admin credentials
        const credDocRef = doc(db, 'admin', 'credentials');
        const credSnapshot = await getDoc(credDocRef);
        if (credSnapshot.exists()) {
          setAdminCreds(credSnapshot.data() as { username: string; password: string });
        } else {
          // Initialize if empty
          await setDoc(credDocRef, { username: "PradosBlack9k", password: "blados9k@pra" });
        }

      } catch (err) {
        console.error("Error loading Firestore data:", err);
      }
    };

    loadAllData();
  }, []);

  // OTP Countdown Timer effect
  useEffect(() => {
    if (otpSent && otpTimer > 0) {
      const interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setSentOtpCode("");
            setOtpSent(false);
            setCredMessage("OTP has expired. Please request a new one.");
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpSent, otpTimer]);

  // --- UNDO / REDO HISTORY STACK ---
  const [historyStack, setHistoryStack] = useState<SiteContent[]>([defaultContent]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const pushToHistory = (newContent: SiteContent) => {
    setHistoryStack((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, newContent];
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const handleUndo = async () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevState = historyStack[prevIndex];
      setHistoryIndex(prevIndex);
      setSiteContent(prevState);
      try {
        const contentDocRef = doc(db, 'content', 'main_page');
        await setDoc(contentDocRef, prevState, { merge: true });
      } catch (e) {
        console.error('Error undoing content update:', e);
      }
    }
  };

  const handleRedo = async () => {
    if (historyIndex < historyStack.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextState = historyStack[nextIndex];
      setHistoryIndex(nextIndex);
      setSiteContent(nextState);
      try {
        const contentDocRef = doc(db, 'content', 'main_page');
        await setDoc(contentDocRef, nextState, { merge: true });
      } catch (e) {
        console.error('Error redoing content update:', e);
      }
    }
  };

  // --- CUSTOM PANELS OPERATIONS ---
  const customPanels: CustomPanel[] = siteContent.customPanels || [];

  const handleAddPanel = async (type: CustomPanel['type']) => {
    const newId = Date.now().toString();
    let newPanel: CustomPanel;

    if (type === 'banner') {
      newPanel = {
        id: newId,
        type: 'banner',
        title: 'SPECIAL ANNOUNCEMENT',
        subtitle: 'Book your dog stay early for upcoming holiday seasons and long weekends!',
        badge: 'PROMO NOTICE'
      };
    } else if (type === 'features') {
      newPanel = {
        id: newId,
        type: 'features',
        title: 'FACILITY HIGHLIGHTS',
        subtitle: 'Safety protocols and daily routines.',
        items: [
          { id: '1', title: '24/7 Security', desc: 'Monitored perimeter fencing and climate control.' },
          { id: '2', title: 'Certified Handlers', desc: 'Experienced trainers overseeing every play session.' },
          { id: '3', title: 'Custom Diet', desc: 'Feeding according to your exact home schedule.' }
        ]
      };
    } else if (type === 'testimonials') {
      newPanel = {
        id: newId,
        type: 'testimonials',
        title: 'Siddharth V.',
        content: 'The obedience training completely transformed our energetic Golden Retriever!'
      };
    } else if (type === 'cards') {
      newPanel = {
        id: newId,
        type: 'cards',
        title: 'SPECIALTY PACKAGES',
        subtitle: 'Add-on care packages for your pet.',
        items: [
          { id: '1', tag: 'Popular', title: 'Agility Play', price: '₹500', desc: '1-on-1 obstacle course session with a handler.' },
          { id: '2', tag: 'Wellness', title: 'Hydro Therapy', price: '₹800', desc: 'Low impact swimming and warm splash bath.' },
          { id: '3', tag: 'Luxury', title: 'VIP Suite', price: '₹1,500', desc: 'Includes webcam feed and orthopedic bedding.' }
        ]
      };
    } else {
      newPanel = {
        id: newId,
        type: 'richText',
        title: 'CARE RULES & INFORMATION',
        content: 'Please ensure your dog vaccination records (DHPP, Rabies, Kennel Cough) are updated prior to check-in.'
      };
    }

    const updatedPanels = [...customPanels, newPanel];
    const updatedContent = { ...siteContent, customPanels: updatedPanels };
    setSiteContent(updatedContent);
    pushToHistory(updatedContent);

    try {
      const contentDocRef = doc(db, 'content', 'main_page');
      await setDoc(contentDocRef, { customPanels: updatedPanels }, { merge: true });
    } catch (err) {
      console.error("Error adding panel:", err);
    }
  };

  const handleDeletePanel = async (id: string) => {
    const updatedPanels = customPanels.filter((p) => p.id !== id);
    const updatedContent = { ...siteContent, customPanels: updatedPanels };
    setSiteContent(updatedContent);
    pushToHistory(updatedContent);

    try {
      const contentDocRef = doc(db, 'content', 'main_page');
      await setDoc(contentDocRef, { customPanels: updatedPanels }, { merge: true });
    } catch (err) {
      console.error("Error deleting panel:", err);
    }
  };

  const handleUpdatePanelItems = async (panelId: string, newItems: CustomPanelItem[]) => {
    const updatedPanels = customPanels.map((p) => {
      if (p.id === panelId) {
        return { ...p, items: newItems };
      }
      return p;
    });
    const updatedContent = { ...siteContent, customPanels: updatedPanels };
    setSiteContent(updatedContent);
    pushToHistory(updatedContent);

    try {
      const contentDocRef = doc(db, 'content', 'main_page');
      await setDoc(contentDocRef, { customPanels: updatedPanels }, { merge: true });
    } catch (err) {
      console.error("Error updating panel items:", err);
    }
  };

  // --- PERSIST CONTENT CHANGES ---
  const updateContent = async (key: string, value: string) => {
    // Update state immediately for visual response
    const updatedContent = { ...siteContent, [key]: value };
    setSiteContent(updatedContent);
    pushToHistory(updatedContent);

    try {
      const contentDocRef = doc(db, 'content', 'main_page');
      await setDoc(contentDocRef, { [key]: value }, { merge: true });
    } catch (err) {
      console.error("Error saving content to Firestore:", err);
    }
  };

  // --- WHATSAPP / SMS SCRIPT TRIGGERS ---
  const triggerWhatsApp = (details: {
    name: string;
    phone: string;
    location: string;
    dogName: string;
    service: string;
    details: string;
  }) => {
    const text = `🐾 *Black Prados K9 Enquiry* 🐾\n\n` +
                 `👤 *Name:* ${details.name}\n` +
                 `📞 *Phone:* ${details.phone}\n` +
                 `📍 *Location:* ${details.location}\n` +
                 `🐕 *Dog's Name:* ${details.dogName}\n` +
                 `✨ *Service:* ${details.service}\n` +
                 `📝 *Details:* ${details.details}`;
    
    const whatsappUrl = `https://wa.me/919645051054?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const triggerSMS = (details: {
    name: string;
    phone: string;
    location: string;
    dogName: string;
    service: string;
    details: string;
  }) => {
    const text = `🐾 Black Prados K9 Enquiry 🐾\n\n` +
                 `👤 Name: ${details.name}\n` +
                 `📞 Phone: ${details.phone}\n` +
                 `📍 Location: ${details.location}\n` +
                 `🐕 Dog: ${details.dogName}\n` +
                 `✨ Service: ${details.service}\n` +
                 `📝 Details: ${details.details}`;
    
    const smsUrl = `sms:+919645051054?body=${encodeURIComponent(text)}`;
    window.open(smsUrl, '_blank');
  };

  // --- AUTOMATED BACKGROUND WHATSAPP BOT NOTIFICATION ---
  const sendWhatsAppBotNotification = async (details: {
    name: string;
    phone: string;
    location: string;
    dogName: string;
    service: string;
    details: string;
  }) => {
    const isBotEnabled = siteContent.whatsapp_bot_enabled === "true";
    const botPhone = siteContent.whatsapp_bot_phone || "919645051054";
    const botApiKey = siteContent.whatsapp_bot_apikey;

    if (!isBotEnabled || !botApiKey) {
      console.log("Automated WhatsApp Bot notifications are disabled or missing an API Key.");
      return;
    }

    const text = `🐾 *Black Prados K9 New Enquiry* 🐾\n\n` +
                 `👤 *Name:* ${details.name}\n` +
                 `📞 *Phone:* ${details.phone}\n` +
                 `📍 *Location:* ${details.location}\n` +
                 `🐕 *Dog:* ${details.dogName}\n` +
                 `✨ *Service:* ${details.service}\n` +
                 `📝 *Details:* ${details.details}`;

    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(botPhone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(botApiKey)}`;

    try {
      // Send GET fetch request in no-cors mode so browser doesn't block the request
      await fetch(url, { mode: 'no-cors' });
      console.log("Automated WhatsApp Bot notification triggered successfully!");
    } catch (err) {
      console.error("Failed to trigger CallMeBot WhatsApp notification:", err);
    }
  };

  // --- SUBMISSIONS ---

  // Handle Contact / Meet and Greet Form
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsContactSubmitting(true);
    setContactFormMsg("");

    const newBooking: Booking = {
      name: contactName,
      phone: contactPhone,
      location: contactLocation,
      dogName: contactDogName || "-",
      service: contactService,
      message: contactMessage || "-",
      time: new Date().toLocaleString(),
      source: 'contact'
    };

    try {
      // 1. Save to Firestore
      const docRef = await addDoc(collection(db, 'bookings'), newBooking);
      setBookings((prev) => [{ id: docRef.id, ...newBooking }, ...prev]);

      // 2. Send email via EmailJS (if configured)
      if (EMAILJS_PUBLIC_KEY && EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY") {
        try {
          emailjs.init(EMAILJS_PUBLIC_KEY);
          await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: OWNER_EMAIL,
            from_name: contactName,
            phone: contactPhone,
            location: contactLocation,
            dog_name: contactDogName || "-",
            service: contactService,
            message: contactMessage || "-"
          });
        } catch (emailErr) {
          console.warn("EmailJS failed to send, but data is saved in database.", emailErr);
        }
      }

      // Set WhatsApp / SMS trigger details
      const details = {
        name: contactName,
        phone: contactPhone,
        location: contactLocation,
        dogName: contactDogName || "-",
        service: contactService,
        details: contactMessage || "-"
      };

      // Trigger background WhatsApp Bot notification
      sendWhatsAppBotNotification(details);

      // 3. Reset form
      setContactName("");
      setContactPhone("");
      setContactLocation("");
      setContactDogName("");
      setContactMessage("");
      setContactFormMsg("Request sent successfully! We'll reach out within one business day.");

    } catch (err) {
      console.error("Error submitting contact form:", err);
      setContactFormMsg("Submission error. Please try again or call us directly.");
    } finally {
      setIsContactSubmitting(false);
    }
  };

  // Handle Intake Modal Form
  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Autofill main contact form
    setContactName(ownerName);
    setContactPhone(ownerPhone);
    setContactDogName(dogNameModal);
    setContactService(interestModal);

    const modalBooking: Booking = {
      name: ownerName,
      phone: ownerPhone,
      location: "Intake Survey",
      dogName: dogNameModal,
      service: interestModal,
      message: `Breed: ${dogBreed || 'Unknown'}, Age: ${dogAge || 'Unknown'}, Email: ${ownerEmail || 'Not provided'}`,
      time: new Date().toLocaleString(),
      source: 'modal'
    };

    try {
      // 1. Save to Firestore
      const docRef = await addDoc(collection(db, 'bookings'), modalBooking);
      setBookings((prev) => [{ id: docRef.id, ...modalBooking }, ...prev]);

      // 2. Send email via EmailJS
      if (EMAILJS_PUBLIC_KEY && EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY") {
        try {
          emailjs.init(EMAILJS_PUBLIC_KEY);
          await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: OWNER_EMAIL,
            from_name: ownerName,
            phone: ownerPhone,
            location: "Intake Survey",
            dog_name: dogNameModal,
            service: interestModal,
            message: `Dog Breed: ${dogBreed || '-'}, Age: ${dogAge || '-'}, Email: ${ownerEmail || '-'}`
          });
        } catch (emailErr) {
          console.warn("EmailJS modal failed:", emailErr);
        }
      }

      // Set WhatsApp / SMS trigger details
      const details = {
        name: ownerName,
        phone: ownerPhone,
        location: "Intake Survey",
        dogName: dogNameModal,
        service: interestModal,
        details: `Dog Breed: ${dogBreed || '-'}, Age: ${dogAge || '-'}, Email: ${ownerEmail || '-'}`
      };

      // Trigger background WhatsApp Bot notification
      sendWhatsAppBotNotification(details);
    } catch (err) {
      console.error("Error saving intake booking:", err);
    }

    // Close and save session
    setIsModalOpen(false);
    sessionStorage.setItem('k9_modal_interacted', 'true');
  };

  // Handle Skipping Intake
  const handleSkipIntake = () => {
    setIsModalOpen(false);
    sessionStorage.setItem('k9_modal_interacted', 'true');
  };

  // Handle Feedback Submission
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFbSubmitting(true);
    setFbFormMsg("");

    const newFeedback: Feedback = {
      name: fbFormName,
      service: fbFormService,
      rating: fbFormRating,
      text: fbFormText,
      time: new Date().toLocaleString(),
    };

    try {
      const docRef = await addDoc(collection(db, 'feedback'), newFeedback);
      setFeedbackList((prev) => [{ id: docRef.id, ...newFeedback }, ...prev]);
      setFbFormName("");
      setFbFormText("");
      setFbFormRating(5);
      setFbFormMsg("Thanks for your feedback! It helps other dog owners on the internet.");
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setFbFormMsg("Feedback error. Please try again.");
    } finally {
      setIsFbSubmitting(false);
    }
  };

  // --- ADMIN PORTAL ACTIONS ---
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUser.trim() === adminCreds.username && adminPass.trim() === adminCreds.password) {
      setIsAdminLoggedIn(true);
      setLoginError('');
      sessionStorage.setItem('k9_admin_logged_in', 'true');
    } else {
      setLoginError('Invalid User ID or Password. Try again.');
    }
  };

  const handleSendOtp = async () => {
    setCredMessage("");
    if (!newAdminUser.trim() || !newAdminPass.trim()) {
      setCredMessage("Please enter a new Username and Password.");
      return;
    }
    if (currentAdminPassVerify !== adminCreds.password) {
      setCredMessage("Current password is incorrect.");
      return;
    }

    // Generate random 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setSentOtpCode(otp);
    setOtpSent(true);
    setOtpTimer(300); // 5 minutes countdown

    try {
      emailjs.init(EMAILJS_PUBLIC_KEY);
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email: OWNER_EMAIL,
        from_name: "K9 Security",
        phone: "Verification",
        location: "Admin Credentials Update",
        dog_name: "N/A",
        service: "OTP Code Request",
        message: `Your One-Time Password (OTP) for changing the admin username and password is: ${otp}. It will expire in 5 minutes.`
      });
      setCredMessage("An OTP has been successfully sent to blackpradosk9@gmail.com! Please enter it below to verify and save.");
    } catch (err) {
      console.error("Failed to send OTP email:", err);
      setCredMessage("Failed to send OTP email via EmailJS. Please verify configuration.");
    }
  };

  const handleVerifyAndSaveCreds = async () => {
    setCredMessage("");
    if (!enteredOtp.trim()) {
      setCredMessage("Please enter the OTP verification code.");
      return;
    }
    if (enteredOtp.trim() !== sentOtpCode) {
      setCredMessage("Incorrect OTP. Please check the code and try again.");
      return;
    }

    try {
      const credDocRef = doc(db, 'admin', 'credentials');
      const updatedCreds = {
        username: newAdminUser.trim(),
        password: newAdminPass.trim()
      };
      await setDoc(credDocRef, updatedCreds);
      setAdminCreds(updatedCreds);

      // Reset form states
      setNewAdminUser("");
      setNewAdminPass("");
      setCurrentAdminPassVerify("");
      setEnteredOtp("");
      setSentOtpCode("");
      setOtpSent(false);
      setOtpTimer(0);
      setCredMessage("Success! Username and Password have been updated successfully!");
    } catch (err) {
      console.error("Failed to save credentials to Firestore:", err);
      setCredMessage("Error writing updated credentials to database.");
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('k9_admin_logged_in');
    setAdminUser('');
    setAdminPass('');
  };

  const handleToggleEditMode = () => {
    const nextMode = !editMode;
    setEditMode(nextMode);
    if (nextMode) {
      sessionStorage.setItem('k9_edit_mode_active', 'true');
    } else {
      sessionStorage.removeItem('k9_edit_mode_active');
    }
  };

  // Compress and convert file to Base64 (max-dimension 900px, JPEG format at 0.7 quality)
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 900; // Limit image dimensions to maintain lightweight Firestore payload
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleAddGalleryImage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGalleryProcessing(true);
    setGalleryError("");

    try {
      let finalUrl = "";

      if (galleryInputMode === 'file') {
        if (galleryFileBase64) {
          finalUrl = galleryFileBase64;
        } else if (galleryFile) {
          const base64 = await compressImage(galleryFile);
          finalUrl = base64;
        } else if (editingImageId) {
          // If editing and no new file was uploaded, keep existing URL
          const existingImg = galleryImages.find((img) => img.id === editingImageId);
          if (existingImg) {
            finalUrl = existingImg.url;
          }
        }

        if (!finalUrl) {
          setGalleryError("Please upload a local image file or switch to Paste URL.");
          setIsGalleryProcessing(false);
          return;
        }
      } else {
        if (!galleryUrlInput.trim()) {
          setGalleryError("Please enter a valid image URL.");
          setIsGalleryProcessing(false);
          return;
        }
        finalUrl = galleryUrlInput.trim();
      }

      const imgData: GalleryImage = {
        url: finalUrl,
        label: galleryLabelInput.trim() || 'Gallery'
      };

      if (editingImageId) {
        // Update existing document
        await updateDoc(doc(db, 'gallery', editingImageId), {
          url: imgData.url,
          label: imgData.label
        });
        setGalleryImages((prev) => prev.map((img) => img.id === editingImageId ? { ...img, ...imgData } : img));
        setEditingImageId(null);
      } else {
        // Add new document
        const docRef = await addDoc(collection(db, 'gallery'), imgData);
        setGalleryImages((prev) => [...prev, { id: docRef.id, ...imgData }]);
      }

      // Reset form states
      setGalleryUrlInput("");
      setGalleryLabelInput("");
      setGalleryFile(null);
      setGalleryFileBase64(null);
    } catch (err) {
      console.error("Error saving gallery image:", err);
      setGalleryError("Failed to save image. Please check the file size and try again.");
    } finally {
      setIsGalleryProcessing(false);
    }
  };

  const handleStartEditGalleryImage = (img: GalleryImage) => {
    if (!img.id) return;
    setEditingImageId(img.id);
    if (img.url.startsWith("data:")) {
      setGalleryInputMode("file");
      setGalleryFileBase64(img.url);
      setGalleryUrlInput("");
    } else {
      setGalleryInputMode("url");
      setGalleryUrlInput(img.url);
      setGalleryFileBase64(null);
    }
    setGalleryLabelInput(img.label);
  };

  const handleCancelEditGalleryImage = () => {
    setEditingImageId(null);
    setGalleryUrlInput("");
    setGalleryLabelInput("");
    setGalleryFile(null);
    setGalleryFileBase64(null);
  };

  const handleRemoveGalleryImage = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'gallery', id));
      setGalleryImages((prev) => prev.filter((img) => img.id !== id));
      if (editingImageId === id) {
        handleCancelEditGalleryImage();
      }
    } catch (err) {
      console.error("Error removing gallery image:", err);
    }
  };

  return (
    <div className="min-h-screen selection:bg-ember selection:text-ink relative">
      
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[20%] left-[10%] w-[350px] md:w-[500px] h-[350px] md:h-[500px] rounded-full bg-ember/5 blur-[100px] md:blur-[130px] animate-blob" />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] rounded-full bg-steel/5 blur-[120px] md:blur-[150px] animate-blob animation-delay-2000" />
      </div>

      {/* EDITING TASKBAR (Tools: Color, Font, Text Size, Undo, Redo, Add/Delete Panels) */}
      {isAdminLoggedIn && editMode && (
        <Taskbar
          canUndo={historyIndex > 0}
          canRedo={historyIndex < historyStack.length - 1}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onAddPanel={handleAddPanel}
          customPanels={customPanels}
          onDeletePanel={handleDeletePanel}
          onExitEditMode={handleToggleEditMode}
        />
      )}

      {/* HEADER / NAVIGATION */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-ink-2/90 backdrop-blur-md border-b border-line">
        <nav className="flex items-center justify-between max-w-7xl mx-auto px-6 md:px-12 py-4">
          <div className="flex items-center gap-4">
            {logoLoaded ? (
              <img
                src="logo.jpg"
                alt="Black Prados K9 crest"
                className="w-10 h-10 md:w-12 md:h-12 object-cover rounded-full border border-line"
                onError={() => setLogoLoaded(false)}
              />
            ) : (
              <div className="w-10 h-10 md:w-12 md:h-12 bg-ember text-ink flex items-center justify-center font-display rounded-full border border-line text-lg font-bold">
                K9
              </div>
            )}
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg md:text-xl tracking-wider text-bone uppercase">
                <Editable
                  textKey="header_title"
                  defaultText="Black Prados K9"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </span>
              <span className="text-[10px] md:text-xs font-bold tracking-[0.18em] text-ember uppercase mt-0.5">
                <Editable
                  textKey="header_tagline"
                  defaultText="Wild to Wise"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8 text-[13px] font-bold tracking-wider text-bone/70 uppercase">
            <a href="#boarding" className="hover:text-bone transition-colors">Boarding</a>
            <a href="#training" className="hover:text-bone transition-colors">Training</a>
            <a href="#grooming" className="hover:text-bone transition-colors">Grooming</a>
            <a href="#daycare" className="hover:text-bone transition-colors">Day Care</a>
            <a href="#gallery" className="hover:text-bone transition-colors">Gallery</a>
            <a href="#feedback" className="hover:text-bone transition-colors">Feedback</a>
            <a href="#about" className="hover:text-bone transition-colors">About</a>
            <a href="#contact" className="hover:text-bone transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme((prev) => prev === 'dark' ? 'light' : 'dark')}
              className="text-bone hover:text-ember transition-colors p-2 rounded-full border border-line cursor-pointer flex items-center justify-center bg-ink-2/30"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <a href="#contact" className="bg-ember text-ink hover:translate-y-[-2px] transition-transform font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-sm">
              Book a Stay
            </a>
          </div>
        </nav>
      </header>

      {/* FLOATING ACTION NOTIFICATIONS FOR ADMIN */}
      {editMode && (
        <div className="fixed top-24 right-6 z-40 bg-ember text-ink px-4 py-2.5 rounded-full shadow-lg border border-ember/50 flex items-center gap-2 text-xs font-bold animate-pulse">
          <Edit2 className="w-4 h-4" />
          <span>✎ Edit Mode Active: Click any text to modify</span>
        </div>
      )}

      {/* EXIT EDIT MODE FLOATING BUTTON */}
      {editMode && (
        <button
          onClick={() => {
            setEditMode(false);
            sessionStorage.removeItem('k9_edit_mode_active');
          }}
          className="fixed bottom-24 right-6 z-40 bg-red-800 text-white border border-red-700 hover:bg-red-700 font-bold text-xs px-5 py-3 rounded-full shadow-2xl transition-all cursor-pointer"
        >
          ✕ Exit Edit Mode
        </button>
      )}

      {/* --- INTAKE MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-ink-2 border border-line rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-8 relative shadow-2xl"
            >
              <button
                onClick={handleSkipIntake}
                className="absolute top-4 right-4 text-steel hover:text-bone text-2xl p-2 cursor-pointer transition-colors"
                aria-label="Close"
              >
                &times;
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                {logoLoaded ? (
                  <img
                    src="logo.jpg"
                    alt="Black Prados K9 crest"
                    className="w-12 h-12 object-cover rounded-full border border-line"
                    onError={() => setLogoLoaded(false)}
                  />
                ) : (
                  <div className="w-12 h-12 bg-ember text-ink flex items-center justify-center font-display rounded-full border border-line text-lg font-bold">
                    K9
                  </div>
                )}
                <div className="font-display text-sm tracking-wider text-ember uppercase border border-ember/30 rounded-full px-4 py-1">
                  Welcome to K9
                </div>
              </div>

              <h2 className="text-3xl md:text-4xl font-display text-bone uppercase mb-2 leading-tight">
                Tell us about<br />your dog.
              </h2>
              <p className="text-steel text-sm md:text-base mb-6 max-w-md leading-relaxed">
                A few quick details help us match your dog to the right play group and handlers. Takes under a minute.
              </p>

              <form onSubmit={handleIntakeSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-steel">Your Name</label>
                    <input
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      type="text"
                      required
                      placeholder="Jordan Lee"
                      className="bg-ink border border-line focus:border-ember focus:outline-none text-bone p-3.5 rounded-sm text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-steel">Phone</label>
                    <input
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      className="bg-ink border border-line focus:border-ember focus:outline-none text-bone p-3.5 rounded-sm text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-steel">Email</label>
                  <input
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    type="email"
                    placeholder="jordan@email.com"
                    className="bg-ink border border-line focus:border-ember focus:outline-none text-bone p-3.5 rounded-sm text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-steel">Dog's Name</label>
                    <input
                      value={dogNameModal}
                      onChange={(e) => setDogNameModal(e.target.value)}
                      type="text"
                      required
                      placeholder="Biscuit"
                      className="bg-ink border border-line focus:border-ember focus:outline-none text-bone p-3.5 rounded-sm text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-steel">Breed</label>
                    <input
                      value={dogBreed}
                      onChange={(e) => setDogBreed(e.target.value)}
                      type="text"
                      placeholder="German Shepherd"
                      className="bg-ink border border-line focus:border-ember focus:outline-none text-bone p-3.5 rounded-sm text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-steel">Dog's Age</label>
                    <input
                      value={dogAge}
                      onChange={(e) => setDogAge(e.target.value)}
                      type="text"
                      placeholder="2 years"
                      className="bg-ink border border-line focus:border-ember focus:outline-none text-bone p-3.5 rounded-sm text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-steel">Interested In</label>
                    <select
                      value={interestModal}
                      onChange={(e) => setInterestModal(e.target.value)}
                      className="bg-ink border border-line focus:border-ember focus:outline-none text-bone p-3.5 rounded-sm text-sm"
                    >
                      <option value="Boarding">Boarding</option>
                      <option value="Training">Training</option>
                      <option value="Grooming">Grooming</option>
                      <option value="Day Care">Day Care</option>
                      <option value="Not sure yet">Not sure yet</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="w-full bg-ember text-ink hover:bg-ember/90 font-bold uppercase tracking-wider p-4 rounded-sm transition-all mt-2 cursor-pointer">
                  Continue to site
                </button>
              </form>

              <button
                onClick={handleSkipIntake}
                className="w-full text-center text-xs text-steel hover:text-bone underline mt-4 cursor-pointer"
              >
                Skip for now
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-[180px] pb-24 px-6 md:px-12 border-b border-line overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-7">
            <div className="text-xs md:text-sm font-bold tracking-[0.16em] text-ember uppercase mb-4 flex items-center gap-3">
              <span className="w-6 h-0.5 bg-ember inline-block"></span>
              <Editable
                textKey="hero_eyebrow"
                defaultText="Boarding & Training, Under One Roof"
                siteContent={siteContent}
                updateContent={updateContent}
                editMode={editMode}
              />
            </div>
            
            <h1 className="text-[52px] sm:text-7xl md:text-8xl font-display text-bone leading-none uppercase mb-6">
              <Editable
                textKey="hero_title"
                defaultText="Wild to wise."
                siteContent={siteContent}
                updateContent={updateContent}
                editMode={editMode}
              />
            </h1>

            <div className="text-steel text-base md:text-lg max-w-lg mb-8 leading-relaxed">
              <Editable
                textKey="hero_sub"
                defaultText="Overnight boarding with real yard time, and training programs built by certified handlers — not a kennel that also takes commands."
                siteContent={siteContent}
                updateContent={updateContent}
                editMode={editMode}
                as="p"
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <a href="#contact" className="bg-ember text-ink hover:translate-y-[-2px] transition-transform font-bold text-sm uppercase tracking-wider px-8 py-4.5 rounded-sm">
                <Editable
                  textKey="hero_cta_book"
                  defaultText="Book a stay"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </a>
              <a href="#training" className="border border-line hover:border-bone hover:translate-y-[-2px] text-bone transition-all font-bold text-sm uppercase tracking-wider px-8 py-4.5 rounded-sm">
                <Editable
                  textKey="hero_cta_plans"
                  defaultText="See training plans"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 h-[240px] md:h-[300px] relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 320 220" aria-hidden="true">
              <path className="leash-path" d="M10,20 C 80,10 60,90 140,80 S 220,150 190,190 S 300,210 300,150" />
              <circle cx="10" cy="20" r="5" fill="#c89a56" />
              <text className="leash-tag" x="220" y="120">HEEL</text>
              <text className="leash-tag" x="30" y="60">SIT</text>
              <text className="leash-tag" x="230" y="200">STAY</text>
            </svg>
          </div>
        </div>

        {/* HERO STATS BAR */}
        <div className="max-w-7xl mx-auto mt-16 pt-12 border-t border-line">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col">
              <span className="font-display text-4xl text-bone leading-none">
                <Editable
                  textKey="stat_num_1"
                  defaultText="14"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </span>
              <span className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-steel mt-2">
                <Editable
                  textKey="stat_label_1"
                  defaultText="Years running"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </span>
            </div>

            <div className="flex flex-col">
              <span className="font-display text-4xl text-bone leading-none">
                <Editable
                  textKey="stat_num_2"
                  defaultText="2 acres"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </span>
              <span className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-steel mt-2">
                <Editable
                  textKey="stat_label_2"
                  defaultText="Fenced play yard"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </span>
            </div>

            <div className="flex flex-col">
              <span className="font-display text-4xl text-bone leading-none">
                <Editable
                  textKey="stat_num_3"
                  defaultText="1:4"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </span>
              <span className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-steel mt-2">
                <Editable
                  textKey="stat_label_3"
                  defaultText="Handler to dog ratio"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </span>
            </div>

            <div className="flex flex-col">
              <span className="font-display text-4xl text-bone leading-none">
                <Editable
                  textKey="stat_num_4"
                  defaultText="98%"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </span>
              <span className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-steel mt-2">
                <Editable
                  textKey="stat_label_4"
                  defaultText="Rebooking rate"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* --- BOARDING SECTION --- */}
      <section id="boarding" className="py-24 px-6 md:px-12 border-b border-line">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
            <div>
              <div className="font-display text-xs tracking-widest text-ember border border-ember/30 rounded-full px-3 py-1 w-fit mb-4">
                <Editable
                  textKey="boarding_cmd"
                  defaultText="Boarding"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </div>
              <h2 className="text-4xl md:text-5xl font-display uppercase tracking-tight text-bone">
                <Editable
                  textKey="boarding_heading"
                  defaultText="Overnight stays,<br>zero cage time."
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </h2>
            </div>
            <div className="text-steel text-sm md:text-base max-w-md leading-relaxed">
              <Editable
                textKey="boarding_sub"
                defaultText="Every stay includes three yard sessions a day, a private suite, and a daily photo update — no add-on required. Payment by GPay or cash, settled directly with us — no online checkout."
                siteContent={siteContent}
                updateContent={updateContent}
                editMode={editMode}
                as="p"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[2px] bg-line border border-line">
            {/* Boarding Card 1 */}
            <div className="bg-ink hover:bg-ink-2 transition-colors p-10 flex flex-col justify-between h-full">
              <div>
                <div className="font-display text-xs tracking-wider text-ember border border-ember/30 rounded-full px-3 py-0.5 w-fit mb-8">
                  <Editable
                    textKey="board_card_cmd_1"
                    defaultText="Standard Suite"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </div>
                <h3 className="text-2xl font-display text-bone mb-4 uppercase">
                  <Editable
                    textKey="board_card_title_1"
                    defaultText="The Den"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </h3>
                <div className="text-steel text-sm leading-relaxed mb-8">
                  <Editable
                    textKey="board_card_desc_1"
                    defaultText="A private indoor-outdoor suite with raised bedding, three yard sessions, and twice-daily feeding to your schedule."
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                    as="p"
                  />
                </div>
              </div>
              <div className="font-display text-3xl text-bone">
                <Editable
                  textKey="board_card_price_1"
                  defaultText="₹700"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
                <span className="font-sans text-xs tracking-wider font-bold text-steel uppercase ml-2">/ night</span>
              </div>
            </div>

            {/* Boarding Card 2 */}
            <div className="bg-ink hover:bg-ink-2 transition-colors p-10 flex flex-col justify-between h-full border-t md:border-t-0 md:border-x border-line">
              <div>
                <div className="font-display text-xs tracking-wider text-ember border border-ember/30 rounded-full px-3 py-0.5 w-fit mb-8">
                  <Editable
                    textKey="board_card_cmd_2"
                    defaultText="Most Booked"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </div>
                <h3 className="text-2xl font-display text-bone mb-4 uppercase">
                  <Editable
                    textKey="board_card_title_2"
                    defaultText="The Pack Suite"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </h3>
                <div className="text-steel text-sm leading-relaxed mb-8">
                  <Editable
                    textKey="board_card_desc_2"
                    defaultText="Everything in The Den, plus supervised group play with dogs matched to your dog's energy and size."
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                    as="p"
                  />
                </div>
              </div>
              <div className="font-display text-3xl text-bone">
                <Editable
                  textKey="board_card_price_2"
                  defaultText="₹950"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
                <span className="font-sans text-xs tracking-wider font-bold text-steel uppercase ml-2">/ night</span>
              </div>
            </div>

            {/* Boarding Card 3 */}
            <div className="bg-ink hover:bg-ink-2 transition-colors p-10 flex flex-col justify-between h-full">
              <div>
                <div className="font-display text-xs tracking-wider text-ember border border-ember/30 rounded-full px-3 py-0.5 w-fit mb-8">
                  <Editable
                    textKey="board_card_cmd_3"
                    defaultText="Extended Stay"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </div>
                <h3 className="text-2xl font-display text-bone mb-4 uppercase">
                  <Editable
                    textKey="board_card_title_3"
                    defaultText="The Homestead"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </h3>
                <div className="text-steel text-sm leading-relaxed mb-8">
                  <Editable
                    textKey="board_card_desc_3"
                    defaultText="For stays over a week: a dedicated handler, one-on-one enrichment time, and a nightly video call if you want it."
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                    as="p"
                  />
                </div>
              </div>
              <div className="font-display text-3xl text-bone">
                <Editable
                  textKey="board_card_price_3"
                  defaultText="₹1,300"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
                <span className="font-sans text-xs tracking-wider font-bold text-steel uppercase ml-2">/ night</span>
              </div>
            </div>
          </div>

          {/* Quick tags */}
          <div className="flex flex-wrap gap-2.5 mt-10">
            {[0, 1, 2, 3, 4].map((idx) => (
              <span key={idx} className="text-xs md:text-sm font-semibold text-bone border border-line px-4 py-2 rounded-full flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-ember inline-block"></span>
                <Editable
                  textKey={`board_tag_${idx}`}
                  defaultText={defaultContent[`board_tag_${idx}`]}
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* --- TRAINING SECTION --- */}
      <section id="training" className="py-24 px-6 md:px-12 border-b border-line">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
            <div>
              <div className="font-display text-xs tracking-widest text-ember border border-ember/30 rounded-full px-3 py-1 w-fit mb-4">
                <Editable
                  textKey="training_cmd"
                  defaultText="Training"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </div>
              <h2 className="text-4xl md:text-5xl font-display uppercase tracking-tight text-bone">
                <Editable
                  textKey="training_heading"
                  defaultText="Programs that<br>travel home with you."
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </h2>
            </div>
            <div className="text-steel text-sm md:text-base max-w-md leading-relaxed">
              <Editable
                textKey="training_sub"
                defaultText="Every program ends with a handler session — we teach you the cues, not just the dog."
                siteContent={siteContent}
                updateContent={updateContent}
                editMode={editMode}
                as="p"
              />
            </div>
          </div>

          <div className="flex flex-col">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-8 border-t border-line">
              <div className="md:col-span-2">
                <div className="font-display text-xs tracking-wider text-ember border border-ember/30 rounded-full px-3 py-0.5 w-fit">
                  <Editable
                    textKey="train_row_cmd_1"
                    defaultText="Puppy"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </div>
              </div>
              <div className="md:col-span-3">
                <h3 className="text-2xl font-display text-bone uppercase">
                  <Editable
                    textKey="train_row_title_1"
                    defaultText="Foundations"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </h3>
              </div>
              <div className="md:col-span-5">
                <div className="text-steel text-sm leading-relaxed">
                  <Editable
                    textKey="train_row_desc_1"
                    defaultText="Crate manners, name recognition, and the first commands — for pups 8 to 20 weeks."
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                    as="p"
                  />
                </div>
              </div>
              <div className="md:col-span-2 justify-self-start md:justify-self-end flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-ember"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-line"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-line"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-line"></span>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-8 border-t border-line">
              <div className="md:col-span-2">
                <div className="font-display text-xs tracking-wider text-ember border border-ember/30 rounded-full px-3 py-0.5 w-fit">
                  <Editable
                    textKey="train_row_cmd_2"
                    defaultText="Obedience"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </div>
              </div>
              <div className="md:col-span-3">
                <h3 className="text-2xl font-display text-bone uppercase">
                  <Editable
                    textKey="train_row_title_2"
                    defaultText="House Manners"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </h3>
              </div>
              <div className="md:col-span-5">
                <div className="text-steel text-sm leading-relaxed">
                  <Editable
                    textKey="train_row_desc_2"
                    defaultText="Sit, stay, heel, and recall, reinforced on-leash and off, in the house and out in the yard."
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                    as="p"
                  />
                </div>
              </div>
              <div className="md:col-span-2 justify-self-start md:justify-self-end flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-ember"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-ember"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-line"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-line"></span>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-8 border-t border-line">
              <div className="md:col-span-2">
                <div className="font-display text-xs tracking-wider text-ember border border-ember/30 rounded-full px-3 py-0.5 w-fit">
                  <Editable
                    textKey="train_row_cmd_3"
                    defaultText="Behavior"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </div>
              </div>
              <div className="md:col-span-3">
                <h3 className="text-2xl font-display text-bone uppercase">
                  <Editable
                    textKey="train_row_title_3"
                    defaultText="Reactivity & Anxiety"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </h3>
              </div>
              <div className="md:col-span-5">
                <div className="text-steel text-sm leading-relaxed">
                  <Editable
                    textKey="train_row_desc_3"
                    defaultText="One-on-one work for leash reactivity, separation anxiety, and resource guarding, at the dog's pace."
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                    as="p"
                  />
                </div>
              </div>
              <div className="md:col-span-2 justify-self-start md:justify-self-end flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-ember"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-ember"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-ember"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-line"></span>
              </div>
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-8 border-t border-b border-line mb-16">
              <div className="md:col-span-2">
                <div className="font-display text-xs tracking-wider text-ember border border-ember/30 rounded-full px-3 py-0.5 w-fit">
                  <Editable
                    textKey="train_row_cmd_4"
                    defaultText="Advanced"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </div>
              </div>
              <div className="md:col-span-3">
                <h3 className="text-2xl font-display text-bone uppercase">
                  <Editable
                    textKey="train_row_title_4"
                    defaultText="Off-Leash Reliability"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </h3>
              </div>
              <div className="md:col-span-5">
                <div className="text-steel text-sm leading-relaxed">
                  <Editable
                    textKey="train_row_desc_4"
                    defaultText="Distance commands, distraction-proofing, and real-world recall for dogs ready to go off-leash."
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                    as="p"
                  />
                </div>
              </div>
              <div className="md:col-span-2 justify-self-start md:justify-self-end flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-ember"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-ember"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-ember"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-ember"></span>
              </div>
            </div>
          </div>

          {/* Process steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="border-t-2 border-ember pt-4">
                <span className="font-display text-xs text-ember tracking-wider block mb-2">
                  <Editable
                    textKey={`train_step_num_${num}`}
                    defaultText={`Step ${num}`}
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </span>
                <h4 className="font-sans font-bold text-[15px] text-bone mb-2">
                  <Editable
                    textKey={`train_step_title_${num}`}
                    defaultText={defaultContent[`train_step_title_${num}`]}
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </h4>
                <div className="text-steel text-[13.5px] leading-relaxed">
                  <Editable
                    textKey={`train_step_desc_${num}`}
                    defaultText={defaultContent[`train_step_desc_${num}`]}
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                    as="p"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- GROOMING SECTION --- */}
      <section id="grooming" className="py-24 px-6 md:px-12 border-b border-line">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
            <div>
              <div className="font-display text-xs tracking-widest text-ember border border-ember/30 rounded-full px-3 py-1 w-fit mb-4">
                <Editable
                  textKey="grooming_cmd"
                  defaultText="Grooming"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </div>
              <h2 className="text-4xl md:text-5xl font-display uppercase tracking-tight text-bone">
                <Editable
                  textKey="grooming_heading"
                  defaultText="Wash, trim,<br>and looking sharp."
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </h2>
            </div>
            <div className="text-steel text-sm md:text-base max-w-md leading-relaxed">
              <Editable
                textKey="grooming_sub"
                defaultText="Every groom is handled by one groomer start to finish, so your dog isn't passed station to station. Payment by GPay or cash on the day."
                siteContent={siteContent}
                updateContent={updateContent}
                editMode={editMode}
                as="p"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[2px] bg-line border border-line">
            {/* Card 1 */}
            <div className="bg-ink hover:bg-ink-2 transition-colors p-10 flex flex-col justify-between h-full">
              <div>
                <div className="font-display text-xs tracking-wider text-ember border border-ember/30 rounded-full px-3 py-0.5 w-fit mb-8">
                  <Editable
                    textKey="groom_card_cmd_1"
                    defaultText="Quick Service"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </div>
                <h3 className="text-2xl font-display text-bone mb-4 uppercase">
                  <Editable
                    textKey="groom_card_title_1"
                    defaultText="Wash & Go"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </h3>
                <div className="text-steel text-sm leading-relaxed mb-8">
                  <Editable
                    textKey="groom_card_desc_1"
                    defaultText="Bath with breed-appropriate shampoo, blow-dry, brush-out, ear cleaning, and nail trim."
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                    as="p"
                  />
                </div>
              </div>
              <div className="font-display text-3xl text-bone">
                <Editable
                  textKey="groom_card_price_1"
                  defaultText="₹600"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
                <span className="font-sans text-xs tracking-wider font-bold text-steel uppercase ml-2">/ visit</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-ink hover:bg-ink-2 transition-colors p-10 flex flex-col justify-between h-full border-t md:border-t-0 md:border-x border-line">
              <div>
                <div className="font-display text-xs tracking-wider text-ember border border-ember/30 rounded-full px-3 py-0.5 w-fit mb-8">
                  <Editable
                    textKey="groom_card_cmd_2"
                    defaultText="Most Booked"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </div>
                <h3 className="text-2xl font-display text-bone mb-4 uppercase">
                  <Editable
                    textKey="groom_card_title_2"
                    defaultText="Full Groom"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </h3>
                <div className="text-steel text-sm leading-relaxed mb-8">
                  <Editable
                    textKey="groom_card_desc_2"
                    defaultText="Everything in Wash & Go, plus a breed-standard or custom haircut and a light finishing spritz."
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                    as="p"
                  />
                </div>
              </div>
              <div className="font-display text-3xl text-bone">
                <Editable
                  textKey="groom_card_price_2"
                  defaultText="₹1,200"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
                <span className="font-sans text-xs tracking-wider font-bold text-steel uppercase ml-2">/ visit</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-ink hover:bg-ink-2 transition-colors p-10 flex flex-col justify-between h-full">
              <div>
                <div className="font-display text-xs tracking-wider text-ember border border-ember/30 rounded-full px-3 py-0.5 w-fit mb-8">
                  <Editable
                    textKey="groom_card_cmd_3"
                    defaultText="Deep Treatment"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </div>
                <h3 className="text-2xl font-display text-bone mb-4 uppercase">
                  <Editable
                    textKey="groom_card_title_3"
                    defaultText="Spa Package"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </h3>
                <div className="text-steel text-sm leading-relaxed mb-8">
                  <Editable
                    textKey="groom_card_desc_3"
                    defaultText="Full groom plus deep-conditioning treatment, teeth brushing, and paw balm for cracked pads."
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                    as="p"
                  />
                </div>
              </div>
              <div className="font-display text-3xl text-bone">
                <Editable
                  textKey="groom_card_price_3"
                  defaultText="₹1,800"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
                <span className="font-sans text-xs tracking-wider font-bold text-steel uppercase ml-2">/ visit</span>
              </div>
            </div>
          </div>

          {/* Process steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-16">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="border-t-2 border-ember pt-4">
                <span className="font-display text-xs text-ember tracking-wider block mb-2">
                  <Editable
                    textKey={`groom_step_num_${num}`}
                    defaultText={`Step ${num}`}
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </span>
                <h4 className="font-sans font-bold text-[15px] text-bone mb-2">
                  <Editable
                    textKey={`groom_step_title_${num}`}
                    defaultText={defaultContent[`groom_step_title_${num}`]}
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </h4>
                <div className="text-steel text-[13.5px] leading-relaxed">
                  <Editable
                    textKey={`groom_step_desc_${num}`}
                    defaultText={defaultContent[`groom_step_desc_${num}`]}
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                    as="p"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- DAYCARE SECTION --- */}
      <section id="daycare" className="py-24 px-6 md:px-12 border-b border-line">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
            <div>
              <div className="font-display text-xs tracking-widest text-ember border border-ember/30 rounded-full px-3 py-1 w-fit mb-4">
                <Editable
                  textKey="daycare_cmd"
                  defaultText="Day Care"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </div>
              <h2 className="text-4xl md:text-5xl font-display uppercase tracking-tight text-bone">
                <Editable
                  textKey="daycare_heading"
                  defaultText="Drop off tired,<br>pick up happy."
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </h2>
            </div>
            <div className="text-steel text-sm md:text-base max-w-md leading-relaxed">
              <Editable
                textKey="daycare_sub"
                defaultText="Dogs are grouped by size and energy, with a handler in every play yard — never left to a camera. Payment by GPay or cash on drop-off."
                siteContent={siteContent}
                updateContent={updateContent}
                editMode={editMode}
                as="p"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[2px] bg-line border border-line">
            {/* Card 1 */}
            <div className="bg-ink hover:bg-ink-2 transition-colors p-10 flex flex-col justify-between h-full">
              <div>
                <div className="font-display text-xs tracking-wider text-ember border border-ember/30 rounded-full px-3 py-0.5 w-fit mb-8">
                  <Editable
                    textKey="daycare_card_cmd_1"
                    defaultText="Single Visit"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </div>
                <h3 className="text-2xl font-display text-bone mb-4 uppercase">
                  <Editable
                    textKey="daycare_card_title_1"
                    defaultText="Half Day"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </h3>
                <div className="text-steel text-sm leading-relaxed mb-8">
                  <Editable
                    textKey="daycare_card_desc_1"
                    defaultText="Up to 5 hours of supervised group play, rest breaks, and fresh water on demand."
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                    as="p"
                  />
                </div>
              </div>
              <div className="font-display text-3xl text-bone">
                <Editable
                  textKey="daycare_card_price_1"
                  defaultText="₹450"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
                <span className="font-sans text-xs tracking-wider font-bold text-steel uppercase ml-2">/ visit</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-ink hover:bg-ink-2 transition-colors p-10 flex flex-col justify-between h-full border-t md:border-t-0 md:border-x border-line">
              <div>
                <div className="font-display text-xs tracking-wider text-ember border border-ember/30 rounded-full px-3 py-0.5 w-fit mb-8">
                  <Editable
                    textKey="daycare_card_cmd_2"
                    defaultText="Most Booked"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </div>
                <h3 className="text-2xl font-display text-bone mb-4 uppercase">
                  <Editable
                    textKey="daycare_card_title_2"
                    defaultText="Full Day"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </h3>
                <div className="text-steel text-sm leading-relaxed mb-8">
                  <Editable
                    textKey="daycare_card_desc_2"
                    defaultText="Drop off in the morning, pick up by close — group play, rest, and a midday enrichment activity."
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                    as="p"
                  />
                </div>
              </div>
              <div className="font-display text-3xl text-bone">
                <Editable
                  textKey="daycare_card_price_2"
                  defaultText="₹650"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
                <span className="font-sans text-xs tracking-wider font-bold text-steel uppercase ml-2">/ visit</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-ink hover:bg-ink-2 transition-colors p-10 flex flex-col justify-between h-full">
              <div>
                <div className="font-display text-xs tracking-wider text-ember border border-ember/30 rounded-full px-3 py-0.5 w-fit mb-8">
                  <Editable
                    textKey="daycare_card_cmd_3"
                    defaultText="Regulars"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </div>
                <h3 className="text-2xl font-display text-bone mb-4 uppercase">
                  <Editable
                    textKey="daycare_card_title_3"
                    defaultText="Weekly Pass"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </h3>
                <div className="text-steel text-sm leading-relaxed mb-8">
                  <Editable
                    textKey="daycare_card_desc_3"
                    defaultText="Five full days, use them anytime in a rolling 30-day window. Ideal for work-week regulars."
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                    as="p"
                  />
                </div>
              </div>
              <div className="font-display text-3xl text-bone">
                <Editable
                  textKey="daycare_card_price_3"
                  defaultText="₹2,800"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
                <span className="font-sans text-xs tracking-wider font-bold text-steel uppercase ml-2">/ week</span>
              </div>
            </div>
          </div>

          {/* Schedule list */}
          <div className="flex flex-col mt-16">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center py-6 border-t border-line last:border-b">
                <div className="md:col-span-2">
                  <div className="font-display text-xs tracking-wider text-ember border border-ember/30 rounded-full px-3 py-0.5 w-fit">
                    <Editable
                      textKey={`daycare_row_cmd_${num}`}
                      defaultText={defaultContent[`daycare_row_cmd_${num}`]}
                      siteContent={siteContent}
                      updateContent={updateContent}
                      editMode={editMode}
                    />
                  </div>
                </div>
                <div className="md:col-span-3">
                  <h3 className="text-xl font-display text-bone uppercase">
                    <Editable
                      textKey={`daycare_row_title_${num}`}
                      defaultText={defaultContent[`daycare_row_title_${num}`]}
                      siteContent={siteContent}
                      updateContent={updateContent}
                      editMode={editMode}
                    />
                  </h3>
                </div>
                <div className="md:col-span-7">
                  <div className="text-steel text-sm leading-relaxed">
                    <Editable
                      textKey={`daycare_row_desc_${num}`}
                      defaultText={defaultContent[`daycare_row_desc_${num}`]}
                      siteContent={siteContent}
                      updateContent={updateContent}
                      editMode={editMode}
                      as="p"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- GALLERY SECTION --- */}
      <section id="gallery" className="py-24 px-6 md:px-12 border-b border-line">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
            <div>
              <div className="font-display text-xs tracking-widest text-ember border border-ember/30 rounded-full px-3 py-1 w-fit mb-4">
                <Editable
                  textKey="gallery_cmd"
                  defaultText="Gallery"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </div>
              <h2 className="text-4xl md:text-5xl font-display uppercase tracking-tight text-bone">
                <Editable
                  textKey="gallery_heading"
                  defaultText="A look inside<br>the yard."
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </h2>
            </div>
            <div className="text-steel text-sm md:text-base max-w-md leading-relaxed">
              <Editable
                textKey="gallery_sub"
                defaultText="Photos from boarding stays, training sessions, groom days, and the play yard."
                siteContent={siteContent}
                updateContent={updateContent}
                editMode={editMode}
                as="p"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {galleryImages.length === 0 ? (
              // Default styling tiles if gallery in Firestore is empty
              <>
                <div className="col-span-2 aspect-square rounded-[2px] relative overflow-hidden border border-line bg-gradient-to-br from-ember/15 via-ink-2 to-ink flex items-end p-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-steel z-10">Play yard</span>
                  <div className="absolute inset-0 flex items-center justify-center font-display text-4xl text-line">+</div>
                </div>
                <div className="aspect-square rounded-[2px] relative overflow-hidden border border-line bg-gradient-to-br from-ember/15 via-ink-2 to-ink flex items-end p-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-steel z-10">Training session</span>
                  <div className="absolute inset-0 flex items-center justify-center font-display text-4xl text-line">+</div>
                </div>
                <div className="aspect-square rounded-[2px] relative overflow-hidden border border-line bg-gradient-to-br from-ember/15 via-ink-2 to-ink flex items-end p-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-steel z-10">Groom day</span>
                  <div className="absolute inset-0 flex items-center justify-center font-display text-4xl text-line">+</div>
                </div>
                <div className="aspect-square rounded-[2px] relative overflow-hidden border border-line bg-gradient-to-br from-ember/15 via-ink-2 to-ink flex items-end p-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-steel z-10">Boarding suite</span>
                  <div className="absolute inset-0 flex items-center justify-center font-display text-4xl text-line">+</div>
                </div>
                <div className="col-span-2 aspect-square rounded-[2px] relative overflow-hidden border border-line bg-gradient-to-br from-ember/15 via-ink-2 to-ink flex items-end p-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-steel z-10">Off-leash work</span>
                  <div className="absolute inset-0 flex items-center justify-center font-display text-4xl text-line">+</div>
                </div>
                <div className="aspect-square rounded-[2px] relative overflow-hidden border border-line bg-gradient-to-br from-ember/15 via-ink-2 to-ink flex items-end p-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-steel z-10">Bath & brush-out</span>
                  <div className="absolute inset-0 flex items-center justify-center font-display text-4xl text-line">+</div>
                </div>
              </>
            ) : (
              // Live Firestore gallery images!
              galleryImages.map((img, i) => {
                const isWide = i % 5 === 0 || i % 6 === 5;
                return (
                  <div
                    key={img.id || i}
                    className={`${isWide ? 'col-span-2' : ''} aspect-square rounded-[2px] relative overflow-hidden border border-line group bg-gradient-to-br from-ember/15 via-ink-2 to-ink flex items-end p-6`}
                  >
                    <img
                      src={img.url}
                      alt={img.label}
                      className="absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
                      <span className="text-xs font-bold uppercase tracking-wider text-bone relative z-10">{img.label}</span>
                    </div>

                    {editMode && (
                      <div className="absolute top-3 right-3 z-20 flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleStartEditGalleryImage(img);
                            // Scroll to admin dashboard
                            const adminPanel = document.getElementById('admin-panel') || document.querySelector('.admin-section');
                            if (adminPanel) adminPanel.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="bg-zinc-900/80 hover:bg-ember border border-line text-bone p-2 rounded-full shadow-lg transition-all cursor-pointer"
                          title="Edit Image"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPublicDeletingImageId(img.id || null);
                          }}
                          className="bg-zinc-900/80 hover:bg-red-600 border border-line text-bone p-2 rounded-full shadow-lg transition-all cursor-pointer"
                          title="Delete Image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Public Delete Confirmation Overlay */}
                    {publicDeletingImageId === img.id && (
                      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-30 text-center gap-2 animate-fade-in">
                        <span className="text-xs text-white font-bold uppercase tracking-wider">Confirm Delete Image?</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (img.id) handleRemoveGalleryImage(img.id);
                              setPublicDeletingImageId(null);
                            }}
                            className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3 py-1.5 rounded-sm uppercase tracking-wider cursor-pointer"
                          >
                            Yes, Delete
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setPublicDeletingImageId(null);
                            }}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs px-3 py-1.5 rounded-sm uppercase tracking-wider cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <p className="text-steel text-sm mt-8">
            <Editable
              textKey="gallery_note"
              defaultText="Photos coming soon — send over your favorites and we'll drop them straight in."
              siteContent={siteContent}
              updateContent={updateContent}
              editMode={editMode}
            />
          </p>
        </div>
      </section>

      {/* --- TESTIMONIAL STRIP --- */}
      <section className="bg-moss py-20 px-6 md:px-12 border-b border-line">
        <div className="max-w-4xl mx-auto text-left">
          <blockquote className="font-display text-2xl sm:text-3xl md:text-4xl tracking-normal text-bone uppercase mb-6 leading-tight">
            <Editable
              textKey="testimonial_quote"
              defaultText="We boarded our reactive rescue for two weeks expecting the worst. He came home calmer than we'd ever seen him — and actually knew 'leave it.'"
              siteContent={siteContent}
              updateContent={updateContent}
              editMode={editMode}
            />
          </blockquote>
          <cite className="block not-italic text-xs md:text-sm font-bold uppercase tracking-wider text-bone/75">
            <Editable
              textKey="testimonial_author"
              defaultText="— Marisol T., boarded & trained a rescue shepherd mix"
              siteContent={siteContent}
              updateContent={updateContent}
              editMode={editMode}
            />
          </cite>
        </div>
      </section>

      {/* --- FEEDBACK SECTION --- */}
      <section id="feedback" className="py-24 px-6 md:px-12 border-b border-line">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-6">
            <div className="font-display text-xs tracking-widest text-ember border border-ember/30 rounded-full px-3 py-1 w-fit mb-4">
              <Editable
                textKey="feedback_cmd"
                defaultText="Feedback"
                siteContent={siteContent}
                updateContent={updateContent}
                editMode={editMode}
              />
            </div>
            <h2 className="text-4xl md:text-5xl font-display uppercase tracking-tight text-bone mb-12">
              <Editable
                textKey="feedback_heading"
                defaultText="What owners<br>are saying."
                siteContent={siteContent}
                updateContent={updateContent}
                editMode={editMode}
              />
            </h2>

            <div className="space-y-8 max-h-[500px] overflow-y-auto pr-4">
              {feedbackList.length === 0 ? (
                // Default feedback items
                <>
                  <div className="border-t border-line pt-6">
                    <div className="text-ember tracking-widest text-sm mb-2">★★★★★</div>
                    <p className="text-bone text-[15.5px] leading-relaxed mb-2">
                      Our puppy went in chewing everything in sight and came out of Foundations actually walking on a loose leash.
                    </p>
                    <cite className="not-italic text-xs font-bold uppercase tracking-wider text-steel">— Arjun K. (Obedience)</cite>
                  </div>
                  <div className="border-t border-line pt-6">
                    <div className="text-ember tracking-widest text-sm mb-2">★★★★★</div>
                    <p className="text-bone text-[15.5px] leading-relaxed mb-2">
                      Day care has been a lifesaver for our work-from-home chaos. He comes home worn out and calm every time.
                    </p>
                    <cite className="not-italic text-xs font-bold uppercase tracking-wider text-steel">— Fenny M. (Day Care)</cite>
                  </div>
                  <div className="border-t border-line pt-6">
                    <div className="text-ember tracking-widest text-sm mb-2">★★★★☆</div>
                    <p className="text-bone text-[15.5px] leading-relaxed mb-2">
                      Groomers were patient with a dog who hates baths. Took a bit longer than expected but the result was worth it.
                    </p>
                    <cite className="not-italic text-xs font-bold uppercase tracking-wider text-steel">— Renjith P. (Grooming)</cite>
                  </div>
                </>
              ) : (
                // Live database feedback list!
                feedbackList.map((fb, idx) => (
                  <div key={fb.id || idx} className="border-t border-line pt-6">
                    <div className="text-ember tracking-widest text-sm mb-2">
                      {"★".repeat(fb.rating)}{"☆".repeat(5 - fb.rating)}
                    </div>
                    <p className="text-bone text-[15.5px] leading-relaxed mb-2">{fb.text}</p>
                    <cite className="not-italic text-xs font-bold uppercase tracking-wider text-steel">
                      — {fb.name} ({fb.service}) · <span className="text-[10px] text-steel/60">{fb.time}</span>
                    </cite>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-6 bg-ink-2 border border-line rounded-sm p-8 md:p-10">
            <h3 className="text-2xl font-display text-bone uppercase mb-6">Leave Feedback</h3>
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-steel">Your Name</label>
                <input
                  value={fbFormName}
                  onChange={(e) => setFbFormName(e.target.value)}
                  type="text"
                  required
                  placeholder="Jordan Lee"
                  className="bg-ink border border-line focus:border-ember focus:outline-none text-bone p-3.5 rounded-sm text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-steel">Service Used</label>
                <select
                  value={fbFormService}
                  onChange={(e) => setFbFormService(e.target.value)}
                  className="bg-ink border border-line focus:border-ember focus:outline-none text-bone p-3.5 rounded-sm text-sm"
                >
                  <option value="Boarding">Boarding</option>
                  <option value="Training">Training</option>
                  <option value="Grooming">Grooming</option>
                  <option value="Day Care">Day Care</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-steel">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFbFormRating(val)}
                      className={`text-2xl hover:scale-110 transition-transform focus:outline-none cursor-pointer ${
                        val <= fbFormRating ? 'text-ember' : 'text-steel'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-steel">Your Feedback</label>
                <textarea
                  value={fbFormText}
                  onChange={(e) => setFbFormText(e.target.value)}
                  required
                  placeholder="How did it go? Our handlers and trainers love to read reviews."
                  className="bg-ink border border-line focus:border-ember focus:outline-none text-bone p-3.5 rounded-sm text-sm min-h-[100px] resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={isFbSubmitting}
                className="bg-ember text-ink hover:bg-ember/90 disabled:opacity-50 font-bold uppercase tracking-wider px-6 py-3 rounded-sm transition-all cursor-pointer text-xs"
              >
                {isFbSubmitting ? "Submitting..." : "Submit feedback"}
              </button>

              {fbFormMsg && (
                <div className="text-xs font-semibold text-ember animate-pulse mt-2" role="status">
                  {fbFormMsg}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* --- ABOUT SECTION --- */}
      <section id="about" className="py-24 px-6 md:px-12 border-b border-line">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="font-display text-xs tracking-widest text-ember border border-ember/30 rounded-full px-3 py-1 w-fit mb-4">
              <Editable
                textKey="about_cmd"
                defaultText="About"
                siteContent={siteContent}
                updateContent={updateContent}
                editMode={editMode}
              />
            </div>
            
            <div className="text-bone text-lg md:text-xl font-medium leading-relaxed">
              <Editable
                textKey="about_p1"
                defaultText="Black Prados K9 started in a converted barn in 2011, because our founder — a certified trainer — got tired of dropping her own dog at kennels that were just cages with a yard attached."
                siteContent={siteContent}
                updateContent={updateContent}
                editMode={editMode}
                as="p"
              />
            </div>

            <div className="text-steel text-base leading-relaxed">
              <Editable
                textKey="about_p2"
                defaultText="Every handler on staff is certified in canine first aid and completes a 6-month apprenticeship under a lead trainer before working solo. Dogs are grouped by temperament, not just size, and every group play session is supervised, never left to a camera."
                siteContent={siteContent}
                updateContent={updateContent}
                editMode={editMode}
                as="p"
              />
            </div>

            <div className="text-steel text-base leading-relaxed">
              <Editable
                textKey="about_p3"
                defaultText="We keep it small on purpose. Capping intake means every dog gets seen, not just fed and let out."
                siteContent={siteContent}
                updateContent={updateContent}
                editMode={editMode}
                as="p"
              />
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-[1px] bg-line border border-line">
            <div className="bg-ink p-8">
              <span className="font-display text-3xl text-bone block">
                <Editable
                  textKey="about_stat_num_1"
                  defaultText="6"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </span>
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-steel mt-2 block">
                <Editable
                  textKey="about_stat_label_1"
                  defaultText="Certified handlers on staff"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </span>
            </div>

            <div className="bg-ink p-8">
              <span className="font-display text-3xl text-bone block">
                <Editable
                  textKey="about_stat_num_2"
                  defaultText="40"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </span>
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-steel mt-2 block">
                <Editable
                  textKey="about_stat_label_2"
                  defaultText="Max dogs on site"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </span>
            </div>

            <div className="bg-ink p-8">
              <span className="font-display text-3xl text-bone block">
                <Editable
                  textKey="about_stat_num_3"
                  defaultText="3x"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </span>
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-steel mt-2 block">
                <Editable
                  textKey="about_stat_label_3"
                  defaultText="Daily yard sessions"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </span>
            </div>

            <div className="bg-ink p-8">
              <span className="font-display text-3xl text-bone block">
                <Editable
                  textKey="about_stat_num_4"
                  defaultText="24/7"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </span>
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-steel mt-2 block">
                <Editable
                  textKey="about_stat_label_4"
                  defaultText="On-site supervision"
                  siteContent={siteContent}
                  updateContent={updateContent}
                  editMode={editMode}
                />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* --- CUSTOM DYNAMIC PANELS SECTION --- */}
      <CustomPanelsSection
        customPanels={customPanels}
        siteContent={siteContent}
        updateContent={updateContent}
        editMode={editMode}
        onDeletePanel={handleDeletePanel}
        onUpdatePanelItems={handleUpdatePanelItems}
      />

      {/* --- CONTACT SECTION --- */}
      <section id="contact" className="py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-5 space-y-6">
            <div className="font-display text-xs tracking-widest text-ember border border-ember/30 rounded-full px-3 py-1 w-fit">
              <Editable
                textKey="contact_cmd"
                defaultText="Contact"
                siteContent={siteContent}
                updateContent={updateContent}
                editMode={editMode}
              />
            </div>

            <h2 className="text-4xl md:text-5xl font-display uppercase tracking-tight text-bone">
              <Editable
                textKey="contact_heading"
                defaultText="Let's meet<br>your dog."
                siteContent={siteContent}
                updateContent={updateContent}
                editMode={editMode}
              />
            </h2>

            <div className="text-steel text-base max-w-sm">
              <Editable
                textKey="contact_sub"
                defaultText="Every new dog starts with a free meet-and-greet, so we can match them to the right group before any stay or session."
                siteContent={siteContent}
                updateContent={updateContent}
                editMode={editMode}
                as="p"
              />
            </div>

            <div className="space-y-0.5 border-t border-line mt-8">
              <div className="flex justify-between items-center py-4 border-b border-line text-sm">
                <span className="text-steel font-semibold uppercase tracking-wider text-[11px]">
                  <Editable
                    textKey="contact_info_label_1"
                    defaultText="Address"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </span>
                <span className="text-bone font-medium">
                  <Editable
                    textKey="contact_info_val_1"
                    defaultText="4420 Orchard Run Rd, Thrissur"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </span>
              </div>

              <div className="flex justify-between items-center py-4 border-b border-line text-sm">
                <span className="text-steel font-semibold uppercase tracking-wider text-[11px]">
                  <Editable
                    textKey="contact_info_label_2"
                    defaultText="Phone"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </span>
                <span className="text-bone font-medium">
                  <Editable
                    textKey="contact_info_val_2"
                    defaultText="(555) 019-2847"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </span>
              </div>

              <div className="flex justify-between items-center py-4 border-b border-line text-sm">
                <span className="text-steel font-semibold uppercase tracking-wider text-[11px]">
                  <Editable
                    textKey="contact_info_label_3"
                    defaultText="Hours"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </span>
                <span className="text-bone font-medium">
                  <Editable
                    textKey="contact_info_val_3"
                    defaultText="Mon–Sat, 7am–7pm"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </span>
              </div>

              <div className="flex justify-between items-center py-4 border-b border-line text-sm">
                <span className="text-steel font-semibold uppercase tracking-wider text-[11px]">
                  <Editable
                    textKey="contact_info_label_4"
                    defaultText="Drop-off"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </span>
                <span className="text-bone font-medium">
                  <Editable
                    textKey="contact_info_val_4"
                    defaultText="By appointment only"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </span>
              </div>

              <div className="flex justify-between items-center py-4 border-b border-line text-sm">
                <span className="text-steel font-semibold uppercase tracking-wider text-[11px]">
                  <Editable
                    textKey="contact_info_label_5"
                    defaultText="Payment"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </span>
                <span className="text-bone font-medium text-right max-w-[200px]">
                  <Editable
                    textKey="contact_info_val_5"
                    defaultText="GPay or cash — paid directly, no online checkout"
                    siteContent={siteContent}
                    updateContent={updateContent}
                    editMode={editMode}
                  />
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-ink-2 border border-line rounded-sm p-8 md:p-10">
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-steel">Your Name</label>
                  <input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    type="text"
                    required
                    placeholder="Jordan Lee"
                    className="bg-ink border border-line focus:border-ember focus:outline-none text-bone p-3.5 rounded-sm text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-steel">Phone Number</label>
                  <input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    className="bg-ink border border-line focus:border-ember focus:outline-none text-bone p-3.5 rounded-sm text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-steel">Your Location / Area</label>
                <input
                  value={contactLocation}
                  onChange={(e) => setContactLocation(e.target.value)}
                  type="text"
                  required
                  placeholder="Thrissur, Kerala"
                  className="bg-ink border border-line focus:border-ember focus:outline-none text-bone p-3.5 rounded-sm text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-steel">Dog's Name</label>
                <input
                  value={contactDogName}
                  onChange={(e) => setContactDogName(e.target.value)}
                  type="text"
                  placeholder="Biscuit"
                  className="bg-ink border border-line focus:border-ember focus:outline-none text-bone p-3.5 rounded-sm text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-steel">What do you need?</label>
                <select
                  value={contactService}
                  onChange={(e) => setContactService(e.target.value)}
                  className="bg-ink border border-line focus:border-ember focus:outline-none text-bone p-3.5 rounded-sm text-sm"
                >
                  <option value="Boarding">Boarding</option>
                  <option value="Training">Training</option>
                  <option value="Grooming">Grooming</option>
                  <option value="Day Care">Day Care</option>
                  <option value="Not sure yet">Not sure yet</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-steel">Anything we should know?</label>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Age, breed, temperament, dates..."
                  className="bg-ink border border-line focus:border-ember focus:outline-none text-bone p-3.5 rounded-sm text-sm min-h-[120px] resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={isContactSubmitting}
                className="bg-ember text-ink hover:bg-ember/90 disabled:opacity-50 font-bold uppercase tracking-wider px-8 py-4.5 rounded-sm transition-all cursor-pointer text-xs"
              >
                {isContactSubmitting ? "Submitting..." : "Request a meet-and-greet"}
              </button>

              {contactFormMsg && (
                <div className="text-sm font-semibold text-ember animate-pulse mt-3" role="status">
                  {contactFormMsg}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-line py-16 px-6 md:px-12 bg-ink">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-sm">
          {/* EXTREME BOTTOM K9 LOGO: CLICK TO ACCESS ADMIN PANEL */}
          <div
            onClick={() => setIsAdminOpen(true)}
            className="flex items-center gap-4 cursor-pointer group"
            title="Black Prados K9 · Click for Admin Panel Access"
            role="button"
            tabIndex={0}
          >
            {logoLoaded ? (
              <img
                src="logo.jpg"
                alt="Black Prados K9 crest"
                className="w-10 h-10 object-cover rounded-full border border-line group-hover:border-ember transition-all group-hover:scale-110 shadow-md"
                onError={() => setLogoLoaded(false)}
              />
            ) : (
              <div className="w-10 h-10 bg-ember text-ink flex items-center justify-center font-display rounded-full border border-line text-base font-bold group-hover:scale-110 transition-all shadow-md">
                K9
              </div>
            )}
            <span className="font-display uppercase tracking-widest text-bone group-hover:text-ember transition-colors">
              <Editable
                textKey="header_title"
                defaultText="Black Prados K9"
                siteContent={siteContent}
                updateContent={updateContent}
                editMode={editMode}
              />
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-steel uppercase font-semibold">
            <a href="#boarding" className="hover:text-bone transition-colors">Boarding</a>
            <a href="#training" className="hover:text-bone transition-colors">Training</a>
            <a href="#grooming" className="hover:text-bone transition-colors">Grooming</a>
            <a href="#daycare" className="hover:text-bone transition-colors">Day Care</a>
            <a href="#about" className="hover:text-bone transition-colors">About</a>
            <a href="#contact" className="hover:text-bone transition-colors">Contact</a>
          </div>

          <div className="text-xs text-steel font-medium">
            <span>&copy; {new Date().getFullYear()} Black Prados K9. Built securely on Cloud Firestore.</span>
          </div>
        </div>
      </footer>

      {/* --- ADMIN OVERLAY DIALOG --- */}
      <AnimatePresence>
        {isAdminOpen && (
          <div className="fixed inset-0 z-50 bg-slate-50/98 backdrop-blur-md overflow-y-auto p-6 md:p-12 flex flex-col text-slate-800">
            <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col">
              
              {/* Overlay Header */}
              <div className="flex justify-between items-center border-b border-slate-200 pb-6 mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🛠</span>
                  <h1 className="font-display text-2xl md:text-3xl tracking-wider text-slate-900">
                    Black Prados K9 · Admin Dashboard
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  {isAdminLoggedIn && (
                    <button
                      onClick={handleToggleEditMode}
                      className={`font-semibold text-xs uppercase tracking-wider px-5 py-2.5 rounded-md cursor-pointer transition-all ${
                        editMode
                          ? 'bg-red-800 hover:bg-red-700 text-white border border-red-700'
                          : 'bg-[#1e4b6e] hover:bg-[#2a6a94] text-white border border-[#3a7aaa]'
                      }`}
                    >
                      {editMode ? "✕ Exit Edit Mode" : "✎ Edit Site Content"}
                    </button>
                  )}
                  {isAdminLoggedIn && (
                    <button
                      onClick={handleAdminLogout}
                      className="bg-transparent hover:bg-slate-200 border border-slate-300 text-slate-600 font-semibold text-xs uppercase tracking-wider px-5 py-2.5 rounded-md cursor-pointer transition-all"
                    >
                      Log Out
                    </button>
                  )}
                  <button
                    onClick={() => setIsAdminOpen(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-md cursor-pointer transition-all"
                  >
                    Close Panel
                  </button>
                </div>
              </div>

              {/* Login State Gate */}
              {!isAdminLoggedIn ? (
                <div className="flex-grow flex items-center justify-center py-12">
                  <div className="bg-white border border-slate-200 rounded-lg p-8 md:p-10 w-full max-w-md shadow-xl">
                    <h2 className="font-display text-2xl text-slate-900 text-center mb-6 uppercase tracking-wider">
                      Admin Portal Login
                    </h2>
                    <form onSubmit={handleAdminLogin} className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">User ID</label>
                        <input
                          value={adminUser}
                          onChange={(e) => setAdminUser(e.target.value)}
                          type="text"
                          required
                          placeholder="Enter user ID"
                          className="bg-slate-50 border border-slate-200 text-slate-800 focus:border-ember focus:outline-none p-3 rounded-sm text-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Password</label>
                        <input
                          value={adminPass}
                          onChange={(e) => setAdminPass(e.target.value)}
                          type="password"
                          required
                          placeholder="Enter password"
                          className="bg-slate-50 border border-slate-200 text-slate-800 focus:border-ember focus:outline-none p-3 rounded-sm text-sm"
                        />
                      </div>
                      <button type="submit" className="w-full bg-[#1e4b6e] hover:bg-[#2a6a94] text-white font-bold uppercase tracking-wider p-3.5 rounded-sm transition-all cursor-pointer text-xs mt-2">
                        Login
                      </button>

                      {loginError && (
                        <div className="flex items-center gap-2 text-xs text-red-600 font-semibold mt-4 text-center justify-center bg-red-50 p-2 border border-red-200 rounded-sm">
                          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                          <span>{loginError}</span>
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              ) : (
                /* --- FULL ADMIN INTERFACE --- */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow">
                  
                  {/* Left Column: Gallery & System Config */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Gallery Manager */}
                    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                      <h3 className="font-display text-lg text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-ember" />
                        <span>{editingImageId ? "📝 Edit Gallery Image" : "🖼️ Gallery Manager"}</span>
                      </h3>
                      <form onSubmit={handleAddGalleryImage} className="space-y-4 mb-6">
                        {/* Input Mode Selector */}
                        <div className="flex gap-2 p-1 bg-slate-50 border border-slate-200 rounded-md mb-2">
                          <button
                            type="button"
                            onClick={() => setGalleryInputMode('file')}
                            className={`flex-grow text-center py-1.5 px-3 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              galleryInputMode === 'file'
                                ? 'bg-slate-800 text-white'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            📁 Local Image File
                          </button>
                          <button
                            type="button"
                            onClick={() => setGalleryInputMode('url')}
                            className={`flex-grow text-center py-1.5 px-3 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              galleryInputMode === 'url'
                                ? 'bg-slate-800 text-white'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            🔗 Paste URL
                          </button>
                        </div>

                        {galleryInputMode === 'file' ? (
                          <div className="space-y-3">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                                Choose Image File
                              </label>
                              <div className="relative border border-dashed border-slate-300 hover:border-ember bg-slate-50 rounded-sm p-4 text-center cursor-pointer transition-colors group">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    setGalleryFile(file);
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (ev) => {
                                        setGalleryFileBase64(ev.target?.result as string);
                                      };
                                      reader.readAsDataURL(file);
                                    } else {
                                      setGalleryFileBase64(null);
                                    }
                                  }}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <ImageIcon className="w-5 h-5 text-slate-400 group-hover:text-ember transition-colors" />
                                  <span className="text-[11px] text-slate-600 font-medium truncate max-w-full px-2">
                                    {galleryFile ? galleryFile.name : "Select or Drop Image"}
                                  </span>
                                  <span className="text-[8px] text-slate-400">
                                    Supports PNG, JPG, WEBP, GIF
                                  </span>
                                </div>
                              </div>
                            </div>

                            {galleryFileBase64 && (
                              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2 rounded-sm">
                                <img
                                  src={galleryFileBase64}
                                  alt="Local upload preview"
                                  className="w-10 h-10 rounded-sm object-cover border border-slate-200 bg-white"
                                />
                                <div className="flex-grow min-w-0">
                                  <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Preview Loaded</div>
                                  <div className="text-[9px] text-slate-500 truncate">
                                    {galleryFile ? `${(galleryFile.size / 1024 / 1024).toFixed(2)} MB` : "Existing Image"}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setGalleryFile(null);
                                    setGalleryFileBase64(null);
                                  }}
                                  className="text-xs text-red-500 hover:text-red-600 px-2 py-1 cursor-pointer"
                                >
                                  Clear
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Image URL</label>
                            <input
                              value={galleryUrlInput}
                              onChange={(e) => setGalleryUrlInput(e.target.value)}
                              type="url"
                              placeholder="https://images.unsplash.com/photo-..."
                              className="bg-slate-50 border border-slate-200 text-slate-800 p-2.5 rounded-sm text-xs focus:border-ember focus:outline-none"
                            />
                          </div>
                        )}

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Label / Category</label>
                          <input
                            value={galleryLabelInput}
                            onChange={(e) => setGalleryLabelInput(e.target.value)}
                            type="text"
                            placeholder="e.g. Play Yard, Training Session"
                            className="bg-slate-50 border border-slate-200 text-slate-800 p-2.5 rounded-sm text-xs focus:border-ember focus:outline-none"
                          />
                        </div>

                        {galleryError && (
                          <div className="text-xs text-red-600 font-semibold bg-red-50 p-2 border border-red-200 rounded-sm">
                            {galleryError}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={isGalleryProcessing}
                            className="flex-grow bg-slate-800 hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold uppercase tracking-wider p-2.5 rounded-sm transition-all text-[11px] cursor-pointer"
                          >
                            {isGalleryProcessing ? "Processing..." : (editingImageId ? "Save Changes" : "Add Image")}
                          </button>
                          {editingImageId && (
                            <button
                              type="button"
                              onClick={handleCancelEditGalleryImage}
                              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase tracking-wider p-2.5 rounded-sm transition-all text-[11px] cursor-pointer px-4"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>

                      {/* Display Gallery Grid for Admin */}
                      <div className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-2">
                        {galleryImages.map((img) => (
                          <div key={img.id} className="aspect-square relative rounded-md border border-slate-200 bg-slate-100 group overflow-hidden">
                            <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center">
                              <span className="text-[9px] text-white font-bold uppercase line-clamp-2">{img.label}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleStartEditGalleryImage(img)}
                              className={`absolute top-1 right-8 p-1 rounded-full border transition-all cursor-pointer z-10 ${
                                editingImageId === img.id
                                  ? 'bg-amber-950/80 border-amber-900/50 text-amber-400'
                                  : 'bg-white/90 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                              }`}
                              title="Edit/Replace Image"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingImageId(img.id || null)}
                              className="absolute top-1 right-1 bg-red-50/90 border border-red-200 text-red-600 p-1 rounded-full hover:bg-red-600 hover:text-white transition-all cursor-pointer z-10"
                              title="Delete Image"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>

                            {/* Custom Confirmation Overlay for Admin Dashboard */}
                            {deletingImageId === img.id && (
                              <div className="absolute inset-0 bg-red-950/95 flex flex-col items-center justify-center p-2 z-20 text-center gap-1.5 animate-fade-in">
                                <span className="text-[10px] text-white font-bold uppercase leading-tight">Delete?</span>
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (img.id) handleRemoveGalleryImage(img.id);
                                      setDeletingImageId(null);
                                    }}
                                    className="bg-red-600 hover:bg-red-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-sm uppercase cursor-pointer"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingImageId(null)}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[9px] px-2 py-0.5 rounded-sm uppercase cursor-pointer"
                                  >
                                    No
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-3">
                        * Added images are stored globally in Firestore and render live in the public gallery!
                    </p>
                  </div>

                  {/* WhatsApp Notification Bot Config */}
                  <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-sm">
                    <h3 className="font-display text-lg text-emerald-600 pb-2 border-b border-slate-100 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-emerald-500" />
                      <span>🤖 Automated WhatsApp Bot</span>
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          Enable Bot Notifications
                        </label>
                        <input
                          type="checkbox"
                          checked={siteContent.whatsapp_bot_enabled === "true"}
                          onChange={async (e) => {
                            const val = e.target.checked ? "true" : "false";
                            await updateContent("whatsapp_bot_enabled", val);
                          }}
                          className="w-4 h-4 accent-emerald-600 cursor-pointer"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                          WhatsApp Phone (with Country Code)
                        </label>
                        <input
                          value={siteContent.whatsapp_bot_phone || "919645051054"}
                          onChange={async (e) => {
                            await updateContent("whatsapp_bot_phone", e.target.value.trim());
                          }}
                          type="text"
                          placeholder="e.g. 919645051054"
                          className="bg-slate-50 border border-slate-200 text-slate-800 p-2.5 rounded-sm text-xs focus:border-emerald-500 focus:outline-none"
                        />
                        <p className="text-[9px] text-slate-400">
                          Do not include symbols like + or -. (e.g., 919645051054)
                        </p>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                          CallMeBot API Key (FREE)
                        </label>
                        <input
                          value={siteContent.whatsapp_bot_apikey || ""}
                          onChange={async (e) => {
                            await updateContent("whatsapp_bot_apikey", e.target.value.trim());
                          }}
                          type="password"
                          placeholder="Enter CallMeBot API key"
                          className="bg-slate-50 border border-slate-200 text-slate-800 p-2.5 rounded-sm text-xs focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-sm space-y-2 text-[11px] text-slate-600">
                        <p className="font-bold text-emerald-700 flex items-center gap-1.5">
                          <span>💡</span> Setup FREE WhatsApp Bot in 15 seconds:
                        </p>
                        <ol className="list-decimal list-inside space-y-1.5">
                          <li>Add <span className="font-mono text-slate-900 font-semibold text-xs">+34 621 07 36 12</span> to your contacts under 'WhatsApp Bot'.</li>
                          <li>Send a WhatsApp message: <span className="font-mono text-slate-900 font-semibold text-xs">I allow callmebot to send me messages</span></li>
                          <li>Copy the API Key they reply with and paste it above!</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* Change Admin Credentials Section */}
                  <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-sm">
                    <h3 className="font-display text-lg text-amber-600 pb-2 border-b border-slate-100 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-500" />
                      <span>🔑 Change Admin Credentials</span>
                    </h3>

                    <div className="space-y-4 text-xs">
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-sm text-amber-800 text-[11px] leading-relaxed">
                        To update credentials, enter your new username, new password, and current password. Then click <strong>Send OTP</strong>.
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                          New Username / User ID
                        </label>
                        <input
                          value={newAdminUser}
                          onChange={(e) => setNewAdminUser(e.target.value)}
                          type="text"
                          placeholder="e.g. AdminK9"
                          className="bg-slate-50 border border-slate-200 text-slate-800 p-2.5 rounded-sm text-xs focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                          New Password
                        </label>
                        <input
                          value={newAdminPass}
                          onChange={(e) => setNewAdminPass(e.target.value)}
                          type="password"
                          placeholder="Enter new secure password"
                          className="bg-slate-50 border border-slate-200 text-slate-800 p-2.5 rounded-sm text-xs focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                          Current Password (Verification)
                        </label>
                        <input
                          value={currentAdminPassVerify}
                          onChange={(e) => setCurrentAdminPassVerify(e.target.value)}
                          type="password"
                          placeholder="Enter your current password"
                          className="bg-slate-50 border border-slate-200 text-slate-800 p-2.5 rounded-sm text-xs focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={otpSent && otpTimer > 0}
                          className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold uppercase tracking-wider text-xs p-3 rounded-sm transition-all cursor-pointer text-center"
                        >
                          {otpSent && otpTimer > 0 ? `OTP Sent (${otpTimer}s)` : "📩 Send OTP to blackpradosk9@gmail.com"}
                        </button>
                      </div>

                      {otpSent && (
                        <div className="border border-emerald-200 bg-emerald-50 p-3.5 rounded-sm space-y-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">
                              Enter 6-Digit OTP Code
                            </label>
                            <input
                              value={enteredOtp}
                              onChange={(e) => setEnteredOtp(e.target.value)}
                              type="text"
                              maxLength={6}
                              placeholder="e.g. 123456"
                              className="bg-white border border-emerald-300 text-slate-800 p-2.5 rounded-sm text-xs font-mono text-center tracking-widest focus:border-emerald-500 focus:outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleVerifyAndSaveCreds}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider text-xs p-2.5 rounded-sm transition-all cursor-pointer text-center"
                          >
                            ✓ Verify & Save New Credentials
                          </button>
                        </div>
                      )}

                      {credMessage && (
                        <div className="text-xs font-semibold p-2.5 rounded-sm text-center bg-slate-50 border border-slate-200 text-amber-700">
                          {credMessage}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick System Info */}
                    <div className="bg-white border border-slate-200 rounded-lg p-6 text-xs text-slate-600 space-y-2 shadow-sm">
                      <div className="font-bold text-sm text-slate-800 mb-2">💾 Database Status</div>
                      <div className="flex justify-between">
                        <span>Connected Database ID:</span>
                        <span className="font-mono text-slate-500">ai-studio-79871270...</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Database System:</span>
                        <span className="text-emerald-600 font-semibold">● Live Cloud Firestore</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Global Access Level:</span>
                        <span className="text-slate-500">Standard Static Admin (All Internet)</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Bookings & User Feedback */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Booking Requests */}
                    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                      <h3 className="font-display text-lg text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-600" />
                        <span>📋 Booking & Meet-and-Greet Requests</span>
                      </h3>
                      <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
                        {bookings.length === 0 ? (
                          <div className="text-slate-400 text-xs py-12 text-center">
                            No booking requests received yet.
                          </div>
                        ) : (
                          bookings.map((bk) => (
                            <div key={bk.id} className="bg-slate-50 border border-slate-200 p-4 rounded-sm text-xs space-y-2 relative">
                              <span className={`absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                bk.source === 'modal' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>
                                {bk.source === 'modal' ? 'Intake' : 'Contact'}
                              </span>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Owner</span>
                                  <span className="text-slate-800 font-semibold text-sm">{bk.name}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone</span>
                                  <span className="text-slate-600 font-mono">{bk.phone}</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 border-t border-slate-200 pt-2">
                                <div>
                                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Dog Name</span>
                                  <span className="text-slate-700 font-medium">{bk.dogName}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Service</span>
                                  <span className="text-ember font-medium uppercase">{bk.service}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Location</span>
                                  <span className="text-slate-600 truncate" title={bk.location}>{bk.location}</span>
                                </div>
                              </div>

                              {bk.message && bk.message !== "-" && (
                                <div className="bg-white p-2 rounded-sm text-slate-600 border-l border-ember mt-2">
                                  <span className="text-slate-400 block text-[9px] uppercase font-bold mb-0.5">Details / Notes</span>
                                  {bk.message}
                                </div>
                              )}

                              <div className="text-[10px] text-slate-400 flex justify-between items-center pt-1">
                                <span>Received: {bk.time}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Feedback Admin List */}
                    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                      <h3 className="font-display text-lg text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-slate-600" />
                        <span>💬 Feedback Messages</span>
                      </h3>
                      <div className="max-h-[220px] overflow-y-auto pr-2 space-y-3">
                        {feedbackList.length === 0 ? (
                          <div className="text-slate-400 text-xs py-6 text-center">
                            No custom user feedback received yet.
                          </div>
                        ) : (
                          feedbackList.map((fb) => (
                            <div key={fb.id} className="bg-slate-50 border border-slate-200 p-3 rounded-sm text-xs space-y-1">
                              <div className="flex justify-between items-start">
                                <span className="font-semibold text-slate-800">{fb.name} <span className="text-slate-400 font-normal">({fb.service})</span></span>
                                <span className="text-ember tracking-widest">{"★".repeat(fb.rating)}</span>
                              </div>
                              <p className="text-slate-600">{fb.text}</p>
                              <div className="text-[9px] text-slate-400 text-right">{fb.time}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
