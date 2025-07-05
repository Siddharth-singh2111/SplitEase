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
      toast.success("📧 Email invite sent successfully!");
    }).catch((error) => {
      console.error("Email send error:", error);
      toast.error("⚠️ Failed to send invite email.");
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
    <div className="p-4 max-w-5xl mx-auto">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-600">SplitEase</h1>
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {auth.currentUser?.displayName || "Profile"}
          </button>
          {showProfile && (
            <div className="absolute right-0 mt-2 w-64 bg-white border shadow-lg p-4 rounded z-50">
              <label className="block text-sm font-medium mb-1">Your Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full border px-2 py-1 rounded mb-2"
              />
              <button
                onClick={async () => {
                  if (auth.currentUser) {
                    await updateProfile(auth.currentUser, { displayName: newName });
                    await setDoc(doc(db, "users", auth.currentUser.uid), {
                      email: auth.currentUser.email,
                      name: newName,
                    });
                    window.location.reload();
                  }
                }}
                className="bg-green-600 text-white px-3 py-1 rounded w-full mb-2"
              >
                Save
              </button>
              <button
                onClick={() => signOut(auth).then(() => navigate("/login"))}
                className="bg-red-600 text-white px-3 py-1 rounded w-full"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <section className="mb-6">
        <div className="flex gap-4 mb-4">
          <input
            placeholder="Create Group"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
          <button onClick={createGroup} className="bg-blue-600 text-white px-4 py-2 rounded">
            Create
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGroup(g)}
              className={`px-4 py-2 rounded border ${selectedGroup?.id === g.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800"
                }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </section>

      {selectedGroup && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-700">{selectedGroup.name}</h2>

          {/* Expense form */}
          <div className="bg-white p-4 rounded shadow space-y-3">
            <h3 className="font-semibold text-lg">Add Expense</h3>
            <input
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border px-3 py-2 rounded w-full"
            />
            <input
              placeholder="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border px-3 py-2 rounded w-full"
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
            <button onClick={addExpense} className="bg-green-600 text-white px-4 py-2 rounded">
              Add Expense
            </button>
          </div>

          {/* Invite section */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold text-lg mb-2">Invite Member by Email</h3>
            <div className="flex gap-3">
              <input
                placeholder="Enter email"
                value={membersInput}
                onChange={(e) => setMembersInput(e.target.value)}
                className="border px-3 py-2 rounded w-full"
              />
              <button onClick={inviteMember} className="bg-blue-600 text-white px-4 py-2 rounded">
                Invite
              </button>
            </div>
          </div>

          {/* Group balances */}
          <div>
            <h3 className="font-semibold text-xl mb-2">Balances</h3>
            {Object.entries(balances).map(([uid, balance]) => (
              <div key={uid} className="flex justify-between items-center bg-gray-100 px-4 py-2 rounded mb-2">
                <span>
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
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Settle Up
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* History */}
          <div className="space-y-4">
            <h3 className="font-semibold text-xl">Expense History</h3>
            {expenses
              .filter((e) => !e.from && !e.to)
              .map((exp, idx) => (
                <div key={idx} className="bg-white p-3 rounded shadow">
                  <p><strong>{exp.description}</strong> — ₹{exp.amount.toFixed(2)}</p>
                  <p>Paid by: {userMap[exp.paidBy]}</p>
                  <p>Split among: {exp.splitBetween.map((id) => userMap[id]).join(", ")}</p>
                  <p className="text-sm text-gray-500">{exp.createdAt?.toDate().toLocaleString()}</p>
                </div>
              ))}
          </div>

          <Analytics expenses={expenses} userMap={userMap} />
        </section>
      )}
    </div>
  );
};

export default Dashboard;
