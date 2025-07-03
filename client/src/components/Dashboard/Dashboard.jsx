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

  // ✅ Send invite email via EmailJS
  const templateParams = {
    to_name: invitedUser.data().name || membersInput,
    inviter_name: user?.displayName || "A SplitEase user",
    group_name: selectedGroup.name,
    group_link: `https://vector-shift-project-k74y.vercel.app/` // replace with your real link
  };

  emailjs.send(
    "service_f3gj1x8",       // <-- replace with your actual Service ID from EmailJS
    "template_1jwjjy9",      // <-- replace with your actual Template ID from EmailJS
    templateParams,
    "LOp301EsusL1f5yWA"        // <-- replace with your actual Public Key (user ID) from EmailJS
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
    <div className="container">
      <div className="dashboard-header">
        <div className="logo">
          <span className="logo-highlight">Split</span>Ease
        </div>
        <div className="profile-section">
          <button className="profile-button" onClick={() => setShowProfile(!showProfile)}>
            {auth.currentUser?.displayName || "Profile"}
          </button>
          {showProfile && (
            <div className="profile-dropdown">
              <p><strong>Name:</strong></p>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="input"
              />
              <button
                className="button save-button"
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
              >
                Save
              </button>
              <button
                className="button logout-button"
                onClick={() => {
                  signOut(auth).then(() => navigate("/login"));
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="section">
        <h3>Your Groups:</h3>
        {groups.map((g) => (
          <button key={g.id} className="group-button" onClick={() => setSelectedGroup(g)}>
            {g.name}
          </button>
        ))}
      </div>

      <div className="section">
        <h3>Create Group:</h3>
        <input
          className="input"
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
        <button className="button" onClick={createGroup}>Create</button>
      </div>

      {selectedGroup && (
        <div className="section">
          <h2>{selectedGroup.name}</h2>

          <div className="section">
            <h4>Add Expense:</h4>
            <input className="input" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <input className="input" placeholder="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Uncategorized</option>
              <option>Food</option>
              <option>Travel</option>
              <option>Rent</option>
              <option>Shopping</option>
              <option>Utilities</option>
            </select>
            <button className="button" onClick={addExpense}>Add Expense</button>
          </div>

          <div className="section">
            <h4>Invite Member by Email:</h4>
            <input className="input" placeholder="Email" value={membersInput} onChange={(e) => setMembersInput(e.target.value)} />
            <button className="button" onClick={inviteMember}>Invite</button>
          </div>

          <div className="section">
            <h3>Group Balances:</h3>
            {Object.entries(balances).map(([uid, balance]) => (
              <div key={uid} style={{ marginBottom: "10px" }}>
                <span className={balance > 0 ? "balance-positive" : "balance-negative"}>
                  {balance > 0
                    ? `${userMap[uid] || uid} is owed ₹${balance.toFixed(2)}`
                    : `${userMap[uid] || uid} owes ₹${Math.abs(balance).toFixed(2)}`
                  }
                </span>
                {balance < 0 && (
                  <button
                    className="button"
                    style={{ marginLeft: "1rem", fontSize: "0.85rem" }}
                    onClick={() => {
                      const creditorId = Object.keys(balances).find((id) => balances[id] > 0);
                      if (creditorId) {
                        settleUp(uid, creditorId, Math.abs(balance));
                      }
                    }}
                  >
                    Settle Up
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="section">
            <h3>Payment History</h3>
            {expenses.filter((e) => e.from && e.to).map((p, idx) => (
              <div className="card" key={idx}>
                <p><strong>{userMap[p.from]}</strong> paid <strong>{userMap[p.to]}</strong> ₹{p.amount}</p>
                <p style={{ fontSize: "0.85rem", color: "#666" }}>{p.createdAt?.toDate().toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="section">
            <h3>Expense History</h3>
            {expenses.filter((e) => !e.from && !e.to).map((exp, idx) => (
              <div className="card" key={idx}>
                <p><strong>{exp.description}</strong> — ₹{exp.amount.toFixed(2)}</p>
                <p>Paid by: <strong>{userMap[exp.paidBy]}</strong></p>
                <p>Split among: {exp.splitBetween.map((uid) => userMap[uid]).join(", ")}</p>
                <p style={{ fontSize: "0.85rem", color: "#666" }}>{exp.createdAt?.toDate().toLocaleString()}</p>
              </div>
            ))}
          </div>

          <Analytics expenses={expenses} userMap={userMap} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
