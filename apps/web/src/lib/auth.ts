import { supabase } from './supabase';
import type { User, UserRole } from '../types';

/**
 * PINをハッシュ化（簡易版）
 * 本番環境では、より強固なハッシュ化を検討
 */
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * ユーザー登録
 */
export async function registerUser(
  nickname: string,
  pin: string,
  role: UserRole = 'student'
): Promise<{ user: User | null; error: string | null }> {
  try {
    // ニックネームの重複チェック
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', nickname)
      .limit(1);

    if (checkError) {
      return { user: null, error: 'ユーザーチェック中にエラーが発生しました' };
    }

    if (existingUsers && existingUsers.length > 0) {
      return { user: null, error: 'このニックネームはすでに使用されています' };
    }

    // PINをハッシュ化
    const pinHash = await hashPin(pin);

    // ユーザーを作成
    const { data, error } = await supabase
      .from('users')
      .insert({
        nickname,
        pin_hash: pinHash,
        role,
      } as any)
      .select()
      .single();

    if (error || !data) {
      return { user: null, error: 'ユーザー登録に失敗しました' };
    }

    const userData = data as any;
    const user: User = {
      id: userData.id,
      nickname: userData.nickname,
      role: userData.role as UserRole,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
    };

    // ローカルストレージに保存
    localStorage.setItem('currentUserId', user.id);
    localStorage.setItem('currentUser', JSON.stringify(user));

    return { user, error: null };
  } catch (err) {
    console.error('Registration error:', err);
    return { user: null, error: '予期しないエラーが発生しました' };
  }
}

/**
 * ログイン
 */
export async function loginUser(
  nickname: string,
  pin: string
): Promise<{ user: User | null; error: string | null }> {
  try {
    // PINをハッシュ化
    const pinHash = await hashPin(pin);

    // ユーザーを検索
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('nickname', nickname)
      .eq('pin_hash', pinHash)
      .single();

    if (error || !data) {
      return { user: null, error: 'ニックネームまたはPINが正しくありません' };
    }

    const userData = data as any;
    const user: User = {
      id: userData.id,
      nickname: userData.nickname,
      role: userData.role as UserRole,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
    };

    // ローカルストレージに保存
    localStorage.setItem('currentUserId', user.id);
    localStorage.setItem('currentUser', JSON.stringify(user));

    return { user, error: null };
  } catch (err) {
    console.error('Login error:', err);
    return { user: null, error: '予期しないエラーが発生しました' };
  }
}

/**
 * ログアウト
 */
export function logoutUser(): void {
  localStorage.removeItem('currentUserId');
  localStorage.removeItem('currentUser');
}

/**
 * 現在のユーザーを取得
 */
export function getCurrentUser(): User | null {
  const userJson = localStorage.getItem('currentUser');
  if (!userJson) return null;

  try {
    return JSON.parse(userJson) as User;
  } catch {
    return null;
  }
}

/**
 * 現在のユーザーIDを取得
 */
export function getCurrentUserId(): string | null {
  return localStorage.getItem('currentUserId');
}
