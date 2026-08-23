import styles from "./Button.module.css";

export default function Button({
    children,
    text,
    icon,
    leftIcon,
    rightIcon,
    variant = "secondary",
    type = "button",
    disabled = false,
    className = "",
    ...props
}) {
    const variantClass = styles[variant] || styles.secondary;
    const content = children ?? text;
    const leadingIcon = leftIcon ?? icon;

    return (
        <button
            type={type}
            disabled={disabled}
            className={`${styles.button} ${variantClass} ${className}`.trim()}
            {...props}
        >
            {leadingIcon && <span className={styles.icon}>{leadingIcon}</span>}
            {content && <span className={styles.text}>{content}</span>}
            {rightIcon && <span className={styles.icon}>{rightIcon}</span>}
        </button>
    );
}