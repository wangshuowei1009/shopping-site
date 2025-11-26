// src/components/EmailModal.jsx
import React, { useState } from 'react';
import './EmailModal.css';

const EmailModal = ({
    isRegister,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    handleEmailLogin,
    handleEmailRegister,
    handleResetPassword, // 根据邮箱发送重置邮件的函数，参数为邮箱字符串
    toggleEmailMode,
    closeEmailModal
}) => {
    // 控制是否切换到忘记密码视图
    const [forgotPassword, setForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');

    const onResetSubmit = async () => {
        if (!resetEmail) {
            alert('メールアドレスを入力してください');
            return;
        }
        try {
            await handleResetPassword(resetEmail);
            alert('パスワード再設定リンクを送信しました。メールを確認してください。');
            setForgotPassword(false);
            setResetEmail('');
        } catch (error) {
            console.error('リセットメール送信失敗:', error);
            alert('送信に失敗しました。後でもう一度お試しください。');
        }
    };

    return (
        <div className="modal-overlay" onClick={closeEmailModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                {forgotPassword ? (
                    <>
                        <h2>パスワード再設定</h2>
                        <p className="modal-description">
                            入力したメールアドレスにパスワード再設定リンクが送信されます。
                        </p>
                        <div className="modal-form">
                            <label>メールアドレス:</label>
                            <input
                                type="email"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                placeholder="メールアドレスを入力してください"
                            />
                        </div>
                        <div className="modal-buttons">
                            <button className="modal-btn primary" onClick={onResetSubmit}>
                                送信
                            </button>
                            <button className="modal-btn secondary" onClick={() => setForgotPassword(false)}>
                                戻る
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2>{isRegister ? '新規登録' : 'ログイン'}</h2>
                        {!isRegister && (
                            <div className="extra-header">
                                ログイン
                            </div>
                        )}
                        <p className="modal-description">
                            {isRegister
                                ? '必要な情報を入力して新規アカウントを作成してください。'
                                : 'メールアドレスとパスワードを入力してログインしてください。'}
                        </p>
                        <div className="modal-form">
                            <label>メールアドレス:</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="メールアドレスを入力してください"
                            />
                            <label>パスワード:</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="パスワードを入力してください"
                            />
                            {isRegister && (
                                <>
                                    <label>パスワード確認:</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="再度パスワードを入力してください"
                                    />
                                </>
                            )}
                        </div>
                        <div className="modal-buttons">
                            {isRegister ? (
                                <button className="modal-btn primary" onClick={handleEmailRegister}>
                                    新規登録
                                </button>
                            ) : (
                                <button className="modal-btn primary" onClick={handleEmailLogin}>
                                    ログイン
                                </button>
                            )}
                            <button className="modal-btn secondary" onClick={closeEmailModal}>
                                キャンセル
                            </button>
                        </div>
                        {!isRegister && (
                            <div className="modal-extra">
                                <button className="link-btn" onClick={() => setForgotPassword(true)}>
                                    パスワードをお忘れですか？
                                </button>
                                <br />
                                <span>
                                    アカウントをお持ちでない場合は{' '}
                                    <button className="link-btn" onClick={toggleEmailMode}>
                                        こちらで登録
                                    </button>
                                </span>
                            </div>
                        )}
                        {isRegister && (
                            <div className="modal-extra">
                                <span>
                                    既にアカウントをお持ちの場合は{' '}
                                    <button className="link-btn" onClick={toggleEmailMode}>
                                        ログイン
                                    </button>
                                </span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default EmailModal;