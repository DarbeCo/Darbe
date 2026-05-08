create or replace function public.send_message(
  target_receiver_id uuid,
  message_body text
)
returns table (
  sender_id uuid,
  receiver_id uuid,
  message text,
  is_read boolean,
  date_sent timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_user_id uuid := auth.uid();
  target_thread_id uuid;
begin
  if sender_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if target_receiver_id is null then
    raise exception 'Receiver is required';
  end if;

  if nullif(trim(message_body), '') is null then
    raise exception 'Message is required';
  end if;

  select mine.thread_id
    into target_thread_id
  from public.message_thread_participants mine
  join public.message_thread_participants theirs
    on theirs.thread_id = mine.thread_id
  where mine.user_id = sender_user_id
    and theirs.user_id = target_receiver_id
  order by mine.thread_id
  limit 1;

  if target_thread_id is null then
    insert into public.message_threads default values
    returning id into target_thread_id;

    insert into public.message_thread_participants (thread_id, user_id)
    values
      (target_thread_id, sender_user_id),
      (target_thread_id, target_receiver_id);
  end if;

  return query
  insert into public.messages (
    thread_id,
    sender_id,
    receiver_id,
    message
  )
  values (
    target_thread_id,
    sender_user_id,
    target_receiver_id,
    message_body
  )
  returning
    messages.sender_id,
    messages.receiver_id,
    messages.message,
    messages.is_read,
    messages.date_sent;
end;
$$;
