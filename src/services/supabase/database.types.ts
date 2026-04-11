export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_type: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          full_name: string | null;
          organization_name: string | null;
          nonprofit_name: string | null;
          ein: string | null;
          city: string;
          zip: string;
          date_of_birth: string | null;
          profile_picture_url: string | null;
          cover_photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_type: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          organization_name?: string | null;
          nonprofit_name?: string | null;
          ein?: string | null;
          city: string;
          zip: string;
          date_of_birth?: string | null;
          profile_picture_url?: string | null;
          cover_photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_type?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          organization_name?: string | null;
          nonprofit_name?: string | null;
          ein?: string | null;
          city?: string;
          zip?: string;
          date_of_birth?: string | null;
          profile_picture_url?: string | null;
          cover_photo_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_details: {
        Row: {
          user_id: string;
          about_me: string | null;
          volunteer_reason: string | null;
          tag_line: string | null;
          gender: string | null;
          race: string | null;
          phone_number: string | null;
          allergies: string | null;
          volunteer_hours: number | null;
          address: string | null;
          state: string | null;
          nonprofit_type: string | null;
          website: string | null;
          motto: string | null;
          mission: string | null;
          values: string | null;
          about_us: string | null;
          programs: string | null;
          parent_entity_id: string | null;
          associated_entity_id: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          emergency_contact_relation: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          about_me?: string | null;
          volunteer_reason?: string | null;
          tag_line?: string | null;
          gender?: string | null;
          race?: string | null;
          phone_number?: string | null;
          allergies?: string | null;
          volunteer_hours?: number | null;
          address?: string | null;
          state?: string | null;
          nonprofit_type?: string | null;
          website?: string | null;
          motto?: string | null;
          mission?: string | null;
          values?: string | null;
          about_us?: string | null;
          programs?: string | null;
          parent_entity_id?: string | null;
          associated_entity_id?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relation?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          about_me?: string | null;
          volunteer_reason?: string | null;
          tag_line?: string | null;
          gender?: string | null;
          race?: string | null;
          phone_number?: string | null;
          allergies?: string | null;
          volunteer_hours?: number | null;
          address?: string | null;
          state?: string | null;
          nonprofit_type?: string | null;
          website?: string | null;
          motto?: string | null;
          mission?: string | null;
          values?: string | null;
          about_us?: string | null;
          programs?: string | null;
          parent_entity_id?: string | null;
          associated_entity_id?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          emergency_contact_relation?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_availability: {
        Row: {
          user_id: string;
          day_of_week: number;
          start_time: string | null;
          end_time: string | null;
          is_open: boolean;
        };
        Insert: {
          user_id: string;
          day_of_week: number;
          start_time?: string | null;
          end_time?: string | null;
          is_open?: boolean;
        };
        Update: {
          user_id?: string;
          day_of_week?: number;
          start_time?: string | null;
          end_time?: string | null;
          is_open?: boolean;
        };
        Relationships: [];
      };
      user_skills: {
        Row: {
          id: string;
          user_id: string;
          skill_name: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          skill_name: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          skill_name?: string;
        };
        Relationships: [];
      };
      user_licenses: {
        Row: {
          id: string;
          user_id: string;
          license_name: string;
          license_issuer: string | null;
          issue_date: string | null;
          expiration_date: string | null;
          does_not_expire: boolean | null;
          description: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          license_name: string;
          license_issuer?: string | null;
          issue_date?: string | null;
          expiration_date?: string | null;
          does_not_expire?: boolean | null;
          description?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          license_name?: string;
          license_issuer?: string | null;
          issue_date?: string | null;
          expiration_date?: string | null;
          does_not_expire?: boolean | null;
          description?: string | null;
        };
        Relationships: [];
      };
      user_education: {
        Row: {
          id: string;
          user_id: string;
          school_name: string;
          degree: string;
          start_date: string;
          end_date: string | null;
          description: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          school_name: string;
          degree: string;
          start_date: string;
          end_date?: string | null;
          description?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          school_name?: string;
          degree?: string;
          start_date?: string;
          end_date?: string | null;
          description?: string | null;
        };
        Relationships: [];
      };
      user_job_experiences: {
        Row: {
          id: string;
          user_id: string;
          job_title: string;
          entity_name: string;
          start_date: string;
          end_date: string | null;
          description: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_title: string;
          entity_name: string;
          start_date: string;
          end_date?: string | null;
          description?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_title?: string;
          entity_name?: string;
          start_date?: string;
          end_date?: string | null;
          description?: string | null;
        };
        Relationships: [];
      };
      user_volunteer_experiences: {
        Row: {
          id: string;
          user_id: string;
          entity_name: string;
          start_date: string;
          end_date: string | null;
          total_hours: number;
          description: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          entity_name: string;
          start_date: string;
          end_date?: string | null;
          total_hours: number;
          description?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          entity_name?: string;
          start_date?: string;
          end_date?: string | null;
          total_hours?: number;
          description?: string | null;
        };
        Relationships: [];
      };
      user_military_service: {
        Row: {
          id: string;
          user_id: string;
          branch: string;
          start_date: string;
          end_date: string | null;
          rank: string | null;
          description: string | null;
          status: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          branch: string;
          start_date: string;
          end_date?: string | null;
          rank?: string | null;
          description?: string | null;
          status?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          branch?: string;
          start_date?: string;
          end_date?: string | null;
          rank?: string | null;
          description?: string | null;
          status?: string | null;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          organization_user_id: string | null;
          is_child_organization: boolean;
          parent_organization_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_user_id?: string | null;
          is_child_organization?: boolean;
          parent_organization_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_user_id?: string | null;
          is_child_organization?: boolean;
          parent_organization_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_organizations: {
        Row: {
          id: string;
          user_id: string;
          organization_name: string;
          position: string;
          start_date: string;
          end_date: string | null;
          description: string | null;
          parent_organization_id: string | null;
          is_child_organization: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_name: string;
          position: string;
          start_date: string;
          end_date?: string | null;
          description?: string | null;
          parent_organization_id?: string | null;
          is_child_organization: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_name?: string;
          position?: string;
          start_date?: string;
          end_date?: string | null;
          description?: string | null;
          parent_organization_id?: string | null;
          is_child_organization?: boolean;
        };
        Relationships: [];
      };
      causes: {
        Row: {
          id: string;
          name: string;
          description: string;
          image_url: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          image_url?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          image_url?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      user_causes: {
        Row: {
          user_id: string;
          cause_id: string;
        };
        Insert: {
          user_id: string;
          cause_id: string;
        };
        Update: {
          user_id?: string;
          cause_id?: string;
        };
        Relationships: [];
      };
      entity_details: {
        Row: {
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      entity_staff: {
        Row: {
          entity_id: string;
          user_id: string;
        };
        Insert: {
          entity_id: string;
          user_id: string;
        };
        Update: {
          entity_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      entity_donors: {
        Row: {
          entity_id: string;
          user_id: string;
        };
        Insert: {
          entity_id: string;
          user_id: string;
        };
        Update: {
          entity_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          url: string;
          document_category: string;
          file_name: string;
          file_type: string;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          url: string;
          document_category: string;
          file_name: string;
          file_type: string;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          url?: string;
          document_category?: string;
          file_name?: string;
          file_type?: string;
          uploaded_at?: string;
        };
        Relationships: [];
      };
      friend_requests: {
        Row: {
          id: string;
          requester_id: string;
          receiver_id: string;
          request_type: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          receiver_id: string;
          request_type: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          receiver_id?: string;
          request_type?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      friendships: {
        Row: {
          user_id: string;
          friend_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          friend_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          friend_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          poster_id: string;
          post_text: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          poster_id: string;
          post_text: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          poster_id?: string;
          post_text?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      post_files: {
        Row: {
          id: string;
          post_id: string;
          file_url: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          file_url: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          file_url?: string;
        };
        Relationships: [];
      };
      post_likes: {
        Row: {
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          comment_text: string;
          parent_comment_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          comment_text: string;
          parent_comment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          comment_text?: string;
          parent_comment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      comment_likes: {
        Row: {
          comment_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          comment_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          comment_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          event_owner_id: string;
          event_name: string;
          event_description: string | null;
          event_date: string;
          start_time: string | null;
          end_time: string | null;
          is_repeating: boolean | null;
          is_followers_only: boolean | null;
          event_parking_info: string | null;
          event_internal_location: string | null;
          is_indoor: boolean | null;
          is_outdoor: boolean | null;
          max_volunteer_count: number;
          event_cover_photo_url: string | null;
          event_coordinator_id: string;
          adult_waiver_url: string | null;
          minor_waiver_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_owner_id: string;
          event_name: string;
          event_description?: string | null;
          event_date: string;
          start_time?: string | null;
          end_time?: string | null;
          is_repeating?: boolean | null;
          is_followers_only?: boolean | null;
          event_parking_info?: string | null;
          event_internal_location?: string | null;
          is_indoor?: boolean | null;
          is_outdoor?: boolean | null;
          max_volunteer_count: number;
          event_cover_photo_url?: string | null;
          event_coordinator_id: string;
          adult_waiver_url?: string | null;
          minor_waiver_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_owner_id?: string;
          event_name?: string;
          event_description?: string | null;
          event_date?: string;
          start_time?: string | null;
          end_time?: string | null;
          is_repeating?: boolean | null;
          is_followers_only?: boolean | null;
          event_parking_info?: string | null;
          event_internal_location?: string | null;
          is_indoor?: boolean | null;
          is_outdoor?: boolean | null;
          max_volunteer_count?: number;
          event_cover_photo_url?: string | null;
          event_coordinator_id?: string;
          adult_waiver_url?: string | null;
          minor_waiver_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      event_addresses: {
        Row: {
          event_id: string;
          location_name: string | null;
          street_name: string | null;
          city: string | null;
          zip_code: string | null;
        };
        Insert: {
          event_id: string;
          location_name?: string | null;
          street_name?: string | null;
          city?: string | null;
          zip_code?: string | null;
        };
        Update: {
          event_id?: string;
          location_name?: string | null;
          street_name?: string | null;
          city?: string | null;
          zip_code?: string | null;
        };
        Relationships: [];
      };
      event_requirements: {
        Row: {
          event_id: string;
          supplies: string | null;
          age_restrictions: string | null;
          attire: string | null;
          lift_requirements: string | null;
        };
        Insert: {
          event_id: string;
          supplies?: string | null;
          age_restrictions?: string | null;
          attire?: string | null;
          lift_requirements?: string | null;
        };
        Update: {
          event_id?: string;
          supplies?: string | null;
          age_restrictions?: string | null;
          attire?: string | null;
          lift_requirements?: string | null;
        };
        Relationships: [];
      };
      event_volunteer_impacts: {
        Row: {
          event_id: string;
          individual_impact: string | null;
          individual_impact_per_hour: string | null;
          group_impact: string | null;
          group_impact_per_hour: string | null;
          is_individual_impact: boolean | null;
          is_group_impact: boolean | null;
        };
        Insert: {
          event_id: string;
          individual_impact?: string | null;
          individual_impact_per_hour?: string | null;
          group_impact?: string | null;
          group_impact_per_hour?: string | null;
          is_individual_impact?: boolean | null;
          is_group_impact?: boolean | null;
        };
        Update: {
          event_id?: string;
          individual_impact?: string | null;
          individual_impact_per_hour?: string | null;
          group_impact?: string | null;
          group_impact_per_hour?: string | null;
          is_individual_impact?: boolean | null;
          is_group_impact?: boolean | null;
        };
        Relationships: [];
      };
      event_signups: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          status: string;
          event_action_timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          status?: string;
          event_action_timestamp?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          status?: string;
          event_action_timestamp?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      message_threads: {
        Row: {
          id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      message_thread_participants: {
        Row: {
          thread_id: string;
          user_id: string;
        };
        Insert: {
          thread_id: string;
          user_id: string;
        };
        Update: {
          thread_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          thread_id: string;
          sender_id: string;
          receiver_id: string;
          message: string;
          is_read: boolean;
          date_sent: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          sender_id: string;
          receiver_id: string;
          message: string;
          is_read?: boolean;
          date_sent?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          sender_id?: string;
          receiver_id?: string;
          message?: string;
          is_read?: boolean;
          date_sent?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      rosters: {
        Row: {
          id: string;
          roster_owner_id: string;
          roster_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          roster_owner_id: string;
          roster_name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          roster_owner_id?: string;
          roster_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      roster_members: {
        Row: {
          roster_id: string;
          user_id: string;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          roster_id: string;
          user_id: string;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          roster_id?: string;
          user_id?: string;
          is_admin?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      impact: {
        Row: {
          id: string;
          impact_owner_id: string;
          user_type: string;
          event_id: string | null;
          hours_volunteered: number;
          events_created: number;
          events_attended: number;
          events_passed: number;
          events_coordinated: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          impact_owner_id: string;
          user_type: string;
          event_id?: string | null;
          hours_volunteered?: number;
          events_created?: number;
          events_attended?: number;
          events_passed?: number;
          events_coordinated?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          impact_owner_id?: string;
          user_type?: string;
          event_id?: string | null;
          hours_volunteered?: number;
          events_created?: number;
          events_attended?: number;
          events_passed?: number;
          events_coordinated?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_user_id: string;
          sender_user_id: string;
          content_type: string;
          content_type_id: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_user_id: string;
          sender_user_id: string;
          content_type: string;
          content_type_id: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_user_id?: string;
          sender_user_id?: string;
          content_type?: string;
          content_type_id?: string;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      get_user_friends: {
        Args: { target_user_id: string };
        Returns: { friend_id: string }[];
      };
      get_mutual_friends: {
        Args: { target_user_id: string };
        Returns: { friend_id: string }[];
      };
      delete_post_and_dependencies: {
        Args: { target_post_id: string };
        Returns: undefined;
      };
      delete_comment_and_replies: {
        Args: { target_comment_id: string };
        Returns: undefined;
      };
      get_event_signup_counts: {
        Args: { event_ids: string[] };
        Returns: { event_id: string; signup_count: number }[];
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
}
