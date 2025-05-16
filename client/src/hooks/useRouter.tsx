import { useNavigate } from "react-router-dom";
import { useNavigationStore } from "../store/global";

export default function useRouter() {
  const navStack = useNavigationStore((state) => state.navStack);
  const setNavStack = useNavigationStore((state) => state.setNavStack);
  const navigate = useNavigate();

  class Router {
    push(path: string, title: string) {
      setNavStack([...navStack, { path, title }]);
      navigate(path);
    }

    back() {
      if (navStack.length > 1) {
        const newNavStack = [...navStack];
        newNavStack.pop();
        setNavStack(newNavStack);

        const lastPath = newNavStack[newNavStack.length - 1].path;
        navigate(lastPath);
      }
    }

    goto(id: number) {
      const newNavStack = navStack.slice(0, id + 1);
      setNavStack(newNavStack);

      const path = newNavStack[id].path;
      navigate(path);
    }

    clear() {
      setNavStack([]);
    }

    replace(path: string, title: string) {
      setNavStack([{ path, title }]);
      navigate(path);
    }
  }

  const router = new Router();

  return router;
}