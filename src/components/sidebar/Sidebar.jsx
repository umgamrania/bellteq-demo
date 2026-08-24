import { useRef, useEffect, useContext, useState, Children } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import Button from "../button/Button";
import styles from "./Sidebar.module.css";
import { sidebarContext } from "../../context/sidebar";
import { boardContext } from "../../context/board";

export default function Sidebar({
    children,
    title = "Choose a backplate",
}) {
    const childArray = Children.toArray(children);
    const context = useContext(sidebarContext);
    const { setMaterial, isStageComplete } = useContext(boardContext) || {};
    const activeIdx = context ? context.activeIdx : 0;
    const setActiveIdx = context ? context.setActiveIdx : () => {};
    const [isMobileExpanded, setIsMobileExpanded] = useState(true);

    // Track direction based on actual index change
    const prevActiveIdxRef = useRef(activeIdx);
    const directionRef = useRef("next");

    if (activeIdx > prevActiveIdxRef.current) {
        directionRef.current = "next";
    } else if (activeIdx < prevActiveIdxRef.current) {
        directionRef.current = "back";
    }
    prevActiveIdxRef.current = activeIdx;

    const direction = directionRef.current;
    const contentRef = useRef(null);

    const hasChildren = childArray.length > 0;
    const isFirst = activeIdx === 0;
    const isLast = activeIdx >= childArray.length - 1;
    const isCurrentStageComplete = isStageComplete ? isStageComplete(activeIdx) : true;

    const currentTitle = childArray[activeIdx]?.props?.title || title;

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [activeIdx]);

    const handleBack = () => {
        directionRef.current = "back";
        setActiveIdx((prev) => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        if (!isCurrentStageComplete) return;
        directionRef.current = "next";
        setActiveIdx((prev) => Math.min(childArray.length - 1, prev + 1));
    };

    return (
        <nav className={`${styles.sidebar} ${!isMobileExpanded ? styles.mobileCollapsed : ""}`}>
            <div className={styles.heading} onClick={() => setIsMobileExpanded((prev) => !prev)}>
                <div className={styles.headingContent}>
                    <span className={styles.stepBadge}>
                        Step {activeIdx + 1} of {childArray.length}
                    </span>
                    <h2>{currentTitle}</h2>
                </div>
                <button
                    type="button"
                    className={styles.mobileToggleBtn}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMobileExpanded((prev) => !prev);
                    }}
                    aria-label={isMobileExpanded ? "Collapse panel" : "Expand panel"}
                >
                    {isMobileExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </button>
            </div>

            <div ref={contentRef} className={styles.content}>
                {hasChildren ? (
                    <div
                        key={activeIdx}
                        className={`${styles.slideContent} ${
                            direction === "next" ? styles.slideNext : styles.slideBack
                        }`}
                    >
                        {childArray[activeIdx]}
                    </div>
                ) : (
                    <span className={styles.nothing}>There's nothing here!</span>
                )}
            </div>

            <div className={styles.controls}>
                <Button 
                    variant="secondary"
                    leftIcon={<ArrowLeft size={16} />}
                    disabled={!hasChildren || isFirst}
                    onClick={handleBack}
                >
                    Back
                </Button>
                <Button 
                    variant="primary"
                    rightIcon={<ArrowRight size={16} />}
                    disabled={!hasChildren || isLast || !isCurrentStageComplete}
                    onClick={handleNext}
                >
                    Next
                </Button>
            </div>
        </nav>
    );
}