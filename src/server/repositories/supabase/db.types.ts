/**
 * Supabase database types, in the same shape `supabase gen types typescript`
 * produces. Regenerate with `npm run db:types` once the CLI is linked.
 * Hand-written to match supabase/migrations/20261103000001_init.sql.
 *
 * ⚠ Only files in src/server/repositories/supabase/ may import this.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Rel<FK extends string, Col extends string, Ref extends string> = {
  foreignKeyName: FK;
  columns: [Col];
  isOneToOne: false;
  referencedRelation: Ref;
  referencedColumns: ["id"];
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Tables: {
      users: {
        Row: { id: string; email: string; password_hash: string; created_at: string };
        Insert: { id?: string; email: string; password_hash: string; created_at?: string };
        Update: { id?: string; email?: string; password_hash?: string; created_at?: string };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          currency: string;
          settlement_mode: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          currency?: string;
          settlement_mode?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          currency?: string;
          settlement_mode?: string;
          created_at?: string;
        };
        Relationships: [Rel<"events_owner_id_fkey", "owner_id", "users">];
      };
      participants: {
        Row: { id: string; event_id: string; name: string; position: number; created_at: string };
        Insert: { id?: string; event_id: string; name: string; position?: number; created_at?: string };
        Update: { id?: string; event_id?: string; name?: string; position?: number; created_at?: string };
        Relationships: [Rel<"participants_event_id_fkey", "event_id", "events">];
      };
      bills: {
        Row: {
          id: string;
          event_id: string;
          title: string;
          bill_date: string | null;
          paid_by: string | null;
          image_path: string | null;
          charge_split_mode: string;
          ocr_raw: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          title: string;
          bill_date?: string | null;
          paid_by?: string | null;
          image_path?: string | null;
          charge_split_mode?: string;
          ocr_raw?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bills"]["Insert"]>;
        Relationships: [
          Rel<"bills_event_id_fkey", "event_id", "events">,
          Rel<"bills_paid_by_fkey", "paid_by", "participants">,
        ];
      };
      bill_items: {
        Row: {
          id: string;
          bill_id: string;
          position: number;
          name: string;
          qty: number;
          unit_price: number;
          total: number;
          split_mode: string;
        };
        Insert: {
          id?: string;
          bill_id: string;
          position: number;
          name: string;
          qty: number;
          unit_price: number;
          total: number;
          split_mode: string;
        };
        Update: Partial<Database["public"]["Tables"]["bill_items"]["Insert"]>;
        Relationships: [Rel<"bill_items_bill_id_fkey", "bill_id", "bills">];
      };
      item_allocations: {
        Row: { item_id: string; participant_id: string; units: number; unit_index: number | null };
        Insert: { item_id: string; participant_id: string; units: number; unit_index?: number | null };
        Update: { item_id?: string; participant_id?: string; units?: number; unit_index?: number | null };
        Relationships: [
          Rel<"item_allocations_item_id_fkey", "item_id", "bill_items">,
          Rel<"item_allocations_participant_id_fkey", "participant_id", "participants">,
        ];
      };
      bill_charges: {
        Row: { id: string; bill_id: string; position: number; kind: string; mode: string; value: number };
        Insert: { id?: string; bill_id: string; position: number; kind: string; mode: string; value: number };
        Update: Partial<Database["public"]["Tables"]["bill_charges"]["Insert"]>;
        Relationships: [Rel<"bill_charges_bill_id_fkey", "bill_id", "bills">];
      };
      share_links: {
        Row: {
          id: string;
          event_id: string;
          slug: string;
          passcode_hash: string | null;
          failed_attempts: number;
          locked_until: string | null;
          enabled: boolean;
          show_photos: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          slug: string;
          passcode_hash?: string | null;
          failed_attempts?: number;
          locked_until?: string | null;
          enabled?: boolean;
          show_photos?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["share_links"]["Insert"]>;
        Relationships: [Rel<"share_links_event_id_fkey", "event_id", "events">];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      save_bill: { Args: { p_bill: Json }; Returns: string };
      save_participants: { Args: { p_event_id: string; p_changes: Json }; Returns: undefined };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
