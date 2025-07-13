import { createRouter, createWebHistory } from "vue-router";
import Login from "../views/Login.vue";
import Dashboard from "../views/Dashboard.vue";
import InterviewManagement from "../components/InterviewManagement.vue";
import Schedule from "../components/Schedule.vue";
import Questions from "../components/Questions.vue";
import Analytics from "../components/Analytics.vue";

const routes = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
  },
  {
    path: "/dashboard",
    component: Dashboard,
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: "Dashboard",
        redirect: "/dashboard/interview",
      },
      {
        path: "interview",
        name: "InterviewManagement",
        component: InterviewManagement,
      },
      {
        path: "schedule",
        name: "Schedule",
        component: Schedule,
      },
      {
        path: "questions",
        name: "Questions",
        component: Questions,
      },
      {
        path: "analytics",
        name: "Analytics",
        component: Analytics,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem("is_logged_in") === "true";

  if (to.meta.requiresAuth && !isLoggedIn) {
    next("/login");
  } else if (to.path === "/login" && isLoggedIn) {
    next("/dashboard");
  } else {
    next();
  }
});

export default router;
