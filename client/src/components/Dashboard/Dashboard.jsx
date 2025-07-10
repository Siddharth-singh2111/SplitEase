import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  updateDoc,
  addDoc,
  setDoc,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { signOut, updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Analytics from "./Analytics";
import { toast } from "react-toastify";
import emailjs from '@emailjs/browser';
import GroupChat from "../GroupChat";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Dashboard = () => {
  const [user] = useAuthState(auth);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [membersInput, setMembersInput] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Uncategorized");
  const [userMap, setUserMap] = useState({});
  const [showProfile, setShowProfile] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || "");
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);


  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(collection(db, "groups"), (snapshot) => {
      const userGroups = snapshot.docs
        .filter((doc) => doc.data().members.includes(user.uid))
        .map((doc) => ({ id: doc.id, ...doc.data() }));
      setGroups(userGroups);
      if (!selectedGroup && userGroups.length > 0) {
        setSelectedGroup(userGroups[userGroups.length - 1]);
      }
    });
    return () => unsubscribe();
  }, [user, selectedGroup]);

  useEffect(() => {
    const fetchUsers = async () => {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const userData = {};
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        userData[doc.id] = data.name || data.email || doc.id;
      });
      setUserMap(userData);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!selectedGroup) return;
    const expensesRef = collection(db, "groups", selectedGroup.id, "expenses");
    const unsubscribe = onSnapshot(expensesRef, (snapshot) => {
      const expenseData = snapshot.docs.map((doc) => doc.data());
      setExpenses(expenseData);
    });
    return () => unsubscribe();
  }, [selectedGroup]);

  const createGroup = async () => {
    if (!groupName) return;
    const newGroup = {
      name: groupName,
      members: [user.uid],
    };
    await addDoc(collection(db, "groups"), newGroup);
    setGroupName("");
    toast.success("🎉 Group created!");
  };

  const addExpense = async () => {
    if (!amount || !description || !selectedGroup) return;
    const groupRef = doc(db, "groups", selectedGroup.id);
    const expense = {
      amount: parseFloat(amount),
      description,
      category,
      paidBy: user.uid,
      splitBetween: selectedGroup.members,
      createdAt: new Date(),
    };
    await addDoc(collection(groupRef, "expenses"), expense);
    setAmount("");
    setDescription("");
    setCategory("Uncategorized");
    toast.success("✅ Expense added");
  };

  const inviteMember = async () => {
    if (!membersInput || !selectedGroup) return;

    const usersSnapshot = await getDocs(collection(db, "users"));
    let invitedUser = null;
    usersSnapshot.forEach((doc) => {
      if (doc.data().email === membersInput) {
        invitedUser = doc;
      }
    });

    if (!invitedUser) {
      toast.error("❌ No user found with that email");
      return;
    }

    const groupRef = doc(db, "groups", selectedGroup.id);
    const updatedMembers = Array.from(new Set([...selectedGroup.members, invitedUser.id]));
    await updateDoc(groupRef, { members: updatedMembers });
    setMembersInput("");

    const templateParams = {
      to_name: invitedUser.data().name || membersInput,
      inviter_name: user?.displayName || "A SplitEase user",
      group_name: selectedGroup.name,
      group_link: `https://vector-shift-project-k74y.vercel.app/`
    };

    emailjs.send(
      "service_f3gj1x8",
      "template_1jwjjy9",
      templateParams,
      "LOp301EsusL1f5yWA"
    ).then(() => {
      toast.success("📧 Email invite sent!");
    }).catch((error) => {
      console.error("Email send error:", error);
      toast.error("⚠️ Failed to send email.");
    });

    toast.success("👤 Member invited!");
  };

  const settleUp = async (fromId, toId, amount) => {
    const groupRef = doc(db, "groups", selectedGroup.id);
    await addDoc(collection(groupRef, "expenses"), {
      from: fromId,
      to: toId,
      amount,
      createdAt: new Date(),
    });
    toast.info("💸 Balance settled!");
  };

  const calculateBalances = () => {
    const balances = {};
    (selectedGroup?.members || []).forEach((uid) => {
      balances[uid] = 0;
    });
    expenses.forEach((exp) => {
      if (exp.from && exp.to) {
        balances[exp.from] -= exp.amount;
        balances[exp.to] += exp.amount;
      } else {
        const perHead = exp.amount / exp.splitBetween.length;
        exp.splitBetween.forEach((uid) => {
          if (uid === exp.paidBy) {
            balances[uid] += exp.amount - perHead;
          } else {
            balances[uid] -= perHead;
          }
        });
      }
    });
    return balances;
  };

  const balances = calculateBalances();

  return (
    <div className="relative">
   <div className="p-6 sm:p-10 max-w-6xl mx-auto bg-gradient-to-br from-[#F8FAFC] to-[#E0F2FE] min-h-screen rounded-lg shadow-xl">

      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-blue-700 tracking-tight">Split <span className="text-black">Ease</span></h1>
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold px-5 py-2 rounded-md hover:scale-105 transition"
          >
            {auth.currentUser?.displayName || "Profile"}
          </button>
          {showProfile && (
            <div className="absolute right-0 mt-3 w-72 bg-white border shadow-xl rounded-lg z-50 p-5">
              <label className="text-gray-700 text-sm font-medium">Your Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 mt-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={async () => {
                  if (auth.currentUser) {
                    try {
                      await updateProfile(auth.currentUser, { displayName: newName });
                      await setDoc(doc(db, "users", auth.currentUser.uid), {
                        email: auth.currentUser.email,
                        name: newName,
                      });
                      toast.success("✅ Name updated!");
                      window.location.reload();
                    } catch (err) {
                      console.error("❌ Error updating profile:", err);
                      toast.error("Failed to update name.");
                    }
                  }
                }}
                className="mt-3 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={() => signOut(auth).then(() => navigate("/login"))}
                className="mt-2 w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Group creation & switch */}
      <section className="mb-6">
        <div className="flex gap-4 mb-4">
          <input
            placeholder="Create Group"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded-md w-full focus:ring focus:ring-blue-300"
          />
          <button onClick={createGroup} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition">
            Create
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGroup(g)}
              className={`px-5 py-2 text-sm rounded-full font-semibold border shadow-sm  transition ${selectedGroup?.id === g.id
                ? "bg-blue-600 text-white"
                : "bg-white  text-gray-700 hover:bg-blue-100"
                }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </section>

      {selectedGroup && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-gray-800 border-b pb-2 mb-4">{selectedGroup.name}</h2>

          {/* Expense form */}
          <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
            <h3 className="font-bold text-lg text-gray-700">Add Expense</h3>
            <input
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border px-3 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <input
              placeholder="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border px-3 py-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border px-3 py-2 rounded w-full"
            >
              <option>Uncategorized</option>
              <option>Food</option>
              <option>Travel</option>
              <option>Rent</option>
              <option>Shopping</option>
              <option>Utilities</option>
            </select>
            <button onClick={addExpense} className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 transition font-medium">
              Add Expense
            </button>
          </div>

          {/* Invite section */}
          <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
            <h3 className="text-2xl font-bold tracking-tight text-gray-800 border-b pb-2 mb-4">Invite Member by Email</h3>
            <div className="flex gap-3">
              <input
                placeholder="Enter email"
                value={membersInput}
                onChange={(e) => setMembersInput(e.target.value)}
                className="border border-gray-300 px-4 py-2 rounded-md w-full focus:ring focus:ring-blue-300"
              />
              <button onClick={inviteMember} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition font-medium">
                Invite
              </button>
            </div>
          </div>

          {/* Group balances */}
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-gray-800 border-b pb-2 mb-4">Balances</h3>
            {Object.entries(balances).map(([uid, balance]) => (
              <div key={uid} className="flex justify-between items-center bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg shadow-sm mb-3">
                <span className="text-sm font-medium text-gray-800">
                  {balance > 0
                    ? `${userMap[uid]} is owed ₹${balance.toFixed(2)}`
                    : `${userMap[uid]} owes ₹${Math.abs(balance).toFixed(2)}`}
                </span>
                {balance < 0 && (
                  <button
                    onClick={() => {
                      const creditor = Object.keys(balances).find((id) => balances[id] > 0);
                      if (creditor) settleUp(uid, creditor, Math.abs(balance));
                    }}
                    className="bg-indigo-600 text-white text-xs px-3 py-1 rounded hover:bg-indigo-700 transition"
                  >
                    Settle Up
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* History */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold tracking-tight text-gray-800 border-b pb-2 mb-4">Expense History</h3>
            {expenses
              .filter((e) => !e.from && !e.to)
              .map((exp, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl shadow space-y-1 text-sm text-gray-700">
                  <p><strong>{exp.description}</strong> — ₹{exp.amount.toFixed(2)}</p>
                  <p className="text-gray-800">Paid by: {userMap[exp.paidBy]}</p>
                  <p className="text-gray-800">Split among: {exp.splitBetween.map((id) => userMap[id]).join(", ")}</p>
                  <p className="text-xs text-gray-800">{exp.createdAt?.toDate().toLocaleString()}</p>
                </div>
              ))}
          </div>

          {/* Analytics and Chat */}
          <Analytics expenses={expenses} userMap={userMap} />
          <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-5 py-3 rounded-full shadow-lg hover:bg-blue-700 transition"
      >
        💬 {chatOpen ? "Close Chat" : "Open Chat"}
      </button>
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white border-l shadow-lg z-40 transform transition-transform duration-300 ${chatOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-lg font-bold text-blue-700">Group Chat</h2>
          <button onClick={() => setChatOpen(false)} className="text-red-500 text-xl font-bold">&times;</button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100vh-70px)]">
          <GroupChat selectedGroup={selectedGroup} userMap={userMap} />
        </div>
      </div>
        </section>
      )}
    </div>
    </div>
  );
};

export default Dashboard;
