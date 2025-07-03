import { useState } from "react";
import { db, auth } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const CreateGroup = () => {
  const [groupName, setGroupName] = useState("");

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    try {
      const user = auth.currentUser;

      // Create a new group document
      await addDoc(collection(db, "groups"), {
        name: groupName,
        members: [user.uid],
        createdAt: serverTimestamp(),
      });

      setGroupName("");
      alert("Group created successfully!");

    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        placeholder="Enter group name"
      />
      <button onClick={handleCreateGroup}>Create Group</button>
    </div>
  );
};

export default CreateGroup;
