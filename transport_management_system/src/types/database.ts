export type UserRole = "passenger" | "staff" | "admin";
export type SeatStatus = "available" | "held" | "booked";
export type BookingStatus = "pending" | "confirmed" | "cancelled";
export type ScheduleStatus = "scheduled" | "departed" | "cancelled";
export type PaymentStatus = "pending" | "success" | "failed" | "refunded";
export type BusStatus = "active" | "maintenance" | "inactive";
export type VehicleType = "bus" | "sienna" | "sharon" | "golf";
export type RouteScope = "within_yobe" | "outside_yobe";

export interface SeatLayout {
  vehicleType?: VehicleType;
  seatNumbers?: string[];
  rows?: number;
  cols?: number;
  aisleAfterCol?: number;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          role: UserRole;
          company_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          role?: UserRole;
          company_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      companies: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          name: string;
          email?: string | null;
          phone?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
      };
      buses: {
        Row: {
          id: string;
          company_id: string;
          plate_number: string;
          model: string | null;
          vehicle_type: VehicleType;
          capacity: number;
          seat_layout: SeatLayout;
          status: BusStatus;
          created_at: string;
        };
        Insert: {
          company_id: string;
          plate_number: string;
          model?: string | null;
          vehicle_type?: VehicleType;
          capacity: number;
          seat_layout?: SeatLayout;
          status?: BusStatus;
        };
        Update: Partial<Database["public"]["Tables"]["buses"]["Insert"]>;
      };
      routes: {
        Row: {
          id: string;
          company_id: string;
          origin: string;
          destination: string;
          route_scope: RouteScope;
          distance_km: number;
          base_fare: number;
          created_at: string;
        };
        Insert: {
          company_id: string;
          origin: string;
          destination: string;
          route_scope?: RouteScope;
          distance_km: number;
          base_fare: number;
        };
        Update: Partial<Database["public"]["Tables"]["routes"]["Insert"]>;
      };
      schedules: {
        Row: {
          id: string;
          route_id: string;
          bus_id: string;
          departure_at: string;
          arrival_at: string;
          fare_override: number | null;
          status: ScheduleStatus;
          created_at: string;
        };
        Insert: {
          route_id: string;
          bus_id: string;
          departure_at: string;
          arrival_at: string;
          fare_override?: number | null;
          status?: ScheduleStatus;
        };
        Update: Partial<Database["public"]["Tables"]["schedules"]["Insert"]>;
      };
      seats: {
        Row: {
          id: string;
          schedule_id: string;
          seat_number: string;
          status: SeatStatus;
          held_by: string | null;
          hold_expires_at: string | null;
          created_at: string;
        };
        Insert: {
          schedule_id: string;
          seat_number: string;
          status?: SeatStatus;
        };
        Update: Partial<Database["public"]["Tables"]["seats"]["Insert"]> & {
          held_by?: string | null;
          hold_expires_at?: string | null;
        };
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          schedule_id: string;
          status: BookingStatus;
          total_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          schedule_id: string;
          status?: BookingStatus;
          total_amount: number;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
      };
      booking_seats: {
        Row: {
          id: string;
          booking_id: string;
          seat_id: string;
        };
        Insert: {
          booking_id: string;
          seat_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["booking_seats"]["Insert"]>;
      };
      tickets: {
        Row: {
          id: string;
          booking_id: string;
          ticket_code: string;
          qr_payload: string;
          issued_at: string;
        };
        Insert: {
          booking_id: string;
          ticket_code: string;
          qr_payload: string;
        };
        Update: Partial<Database["public"]["Tables"]["tickets"]["Insert"]>;
      };
      payments: {
        Row: {
          id: string;
          booking_id: string;
          provider: string;
          reference: string;
          amount: number;
          status: PaymentStatus;
          created_at: string;
        };
        Insert: {
          booking_id: string;
          provider: string;
          reference: string;
          amount: number;
          status?: PaymentStatus;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
      };
      drivers: {
        Row: {
          id: string;
          company_id: string;
          full_name: string;
          license_number: string;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          company_id: string;
          full_name: string;
          license_number: string;
          phone?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["drivers"]["Insert"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Record<string, unknown> | null;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
      };
    };
    Functions: {
      hold_seats: {
        Args: {
          p_schedule_id: string;
          p_seat_ids: string[];
          p_user_id: string;
        };
        Returns: {
          hold_id: string;
          expires_at: string;
        }[];
      };
      confirm_booking: {
        Args: {
          p_schedule_id: string;
          p_seat_ids: string[];
          p_user_id: string;
          p_payment_ref: string;
          p_amount: number;
          p_provider?: string;
        };
        Returns: {
          booking_id: string;
          ticket_code: string;
        }[];
      };
      cancel_booking: {
        Args: {
          p_booking_id: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      get_dashboard_stats: {
        Args: {
          p_company_id?: string;
          p_days?: number;
        };
        Returns: {
          total_bookings: number;
          total_revenue: number;
          active_routes: number;
          occupancy_rate: number;
        }[];
      };
      expire_stale_holds: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Company = Database["public"]["Tables"]["companies"]["Row"];
export type Bus = Database["public"]["Tables"]["buses"]["Row"];
export type Route = Database["public"]["Tables"]["routes"]["Row"];
export type Schedule = Database["public"]["Tables"]["schedules"]["Row"];
export type Seat = Database["public"]["Tables"]["seats"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Ticket = Database["public"]["Tables"]["tickets"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type Driver = Database["public"]["Tables"]["drivers"]["Row"];

export interface ScheduleWithDetails extends Schedule {
  route: Route & { company: Company; driving_duration_minutes?: number };
  bus: Bus;
  seats?: Seat[];
  available_seats?: number;
  total_seats?: number;
}
