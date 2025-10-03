// import { TouchableOpacity } from "react-native";
// import { View } from "react-native/types_generated/index";
// import { Modal } from "react-native/types_generated/index";
// import { useSelector } from "react-redux";

// // Bottom sheet: Support (Call / WhatsApp)
// export const SupportSheet = ({ visible, onClose }) => {
//   const commonInfo = useSelector((s) => s.commonState.commonInfoList);
//   const SUPPORT_PHONE = commonInfo[0]?.whatsAppNumber;
//   const WHATSAPP_PHONE = commonInfo[0]?.supportCallNumber;
//   // console.log("sshika", SUPPORT_PHONE, WHATSAPP_PHONE);
//   return (
//     <Modal
//       visible={visible}
//       transparent
//       animationType="fade"
//       onRequestClose={onClose}
//     >
//       <View style={styles.sheetOverlay}>
//         <TouchableOpacity
//           style={styles.sheetBackdrop}
//           activeOpacity={1}
//           onPress={onClose}
//         />
//         <View style={styles.sheetBody}>
//           <View style={styles.sheetHeader}>
//             <Text style={styles.sheetTitle}>Support</Text>
//             <TouchableOpacity onPress={onClose} hitSlop={10}>
//               <Ionicons name="close" size={22} color="#222" />
//             </TouchableOpacity>
//           </View>

//           <View style={styles.supportCard}>
//             <TouchableOpacity
//               style={styles.supportRow}
//               onPress={() => openDialer(SUPPORT_PHONE)}
//               activeOpacity={0.9}
//             >
//               <View style={styles.supportRowLeft}>
//                 <Ionicons name="call-outline" size={20} color="#222" />
//                 <View>
//                   <Text style={styles.supportTitle}>Call Support</Text>
//                   <Text style={styles.supportSub}>{SUPPORT_PHONE}</Text>
//                 </View>
//               </View>
//               <Ionicons name="call-outline" size={18} color="#1976d2" />
//             </TouchableOpacity>

//             <View style={styles.sheetDivider} />

//             <TouchableOpacity
//               style={styles.supportRow}
//               onPress={() => {
//                 openWhats(WHATSAPP_PHONE);
//               }}
//               activeOpacity={0.9}
//             >
//               <View style={styles.supportRowLeft}>
//                 <Ionicons name="logo-whatsapp" size={20} color="#222" />
//                 <View>
//                   <Text style={styles.supportTitle}>WhatsApp Chat</Text>
//                   <Text style={styles.supportSub}>{WHATSAPP_PHONE}</Text>
//                 </View>
//               </View>
//               <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
//             </TouchableOpacity>
//           </View>

//           <Text style={styles.supportNote}>
//             Our support is available 09:00–21:00 (GMT+6).
//           </Text>
//         </View>
//       </View>
//     </Modal>
//   );
// };
