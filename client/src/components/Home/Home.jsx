import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "../../assets/image.png";
import { FaMoneyBillWave, FaUsers, FaChartPie } from "react-icons/fa";

const Home = () => {
  const navigate = useNavigate();

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-indigo-100 px-4">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center py-16">
        <motion.img
          src={logo}
          alt="SplitEase Logo"
          className="w-28 h-28 mb-4 drop-shadow-lg"
          {...fadeInUp}
        />

        <motion.h1
          className="text-5xl font-bold text-gray-800 mb-2"
          {...fadeInUp}
          transition={{ delay: 0.2 }}
        >
          <span className="text-blue-600">Split</span>Ease
        </motion.h1>

        <motion.p
          className="text-lg text-gray-600 mb-6 max-w-xl"
          {...fadeInUp}
          transition={{ delay: 0.4 }}
        >
          Your smart way to split expenses effortlessly and fairly with friends.
        </motion.p>

        <motion.div
          className="flex gap-4"
          {...fadeInUp}
          transition={{ delay: 0.6 }}
        >
          <motion.button
            onClick={() => navigate("/login")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
          >
            Login
          </motion.button>

          <motion.button
            onClick={() => navigate("/signup")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition"
          >
            Sign Up
          </motion.button>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="max-w-5xl mx-auto py-12 text-center">
        <motion.h2
          className="text-3xl font-bold text-gray-800 mb-10"
          {...fadeInUp}
        >
          Why SplitEase?
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
            {...fadeInUp}
            transition={{ delay: 0.2 }}
          >
            <FaMoneyBillWave className="text-4xl text-green-500 mb-4 mx-auto" />
            <h3 className="font-semibold text-xl mb-2">Smart Expense Tracking</h3>
            <p className="text-gray-600 text-sm">
              Log and split expenses effortlessly with a clean and modern interface.
            </p>
          </motion.div>

          <motion.div
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
            {...fadeInUp}
            transition={{ delay: 0.4 }}
          >
            <FaUsers className="text-4xl text-blue-500 mb-4 mx-auto" />
            <h3 className="font-semibold text-xl mb-2">Group Friendly</h3>
            <p className="text-gray-600 text-sm">
              Create groups, invite friends, and manage shared spending with ease.
            </p>
          </motion.div>

          <motion.div
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
            {...fadeInUp}
            transition={{ delay: 0.6 }}
          >
            <FaChartPie className="text-4xl text-purple-500 mb-4 mx-auto" />
            <h3 className="font-semibold text-xl mb-2">Insightful Analytics</h3>
            <p className="text-gray-600 text-sm">
              Visualize your spending patterns and group stats with smart dashboards.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Home;
