import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/integrations/google/get-google-access-token";

function headerValue(headers: any[] | undefined, name: string) {
  return (
    headers?.find(
      (header) => String(header?.name || "").toLowerCase() === name.toLowerCase()
    )?.value || ""
  );
}

export async function GET(request: NextRequest) {
  try {
    const organizationId = request.nextUrl.searchParams.get("organizationId");
    const calendarId =
      request.nextUrl.searchParams.get("calendarId") || "primary";

    if (!organizationId) {
      return NextResponse.json(
        { success: false, events: [], error: "Missing organizationId." },
        { status: 400 }
      );
    }

    const now = new Date();

    // Default window: beginning of today through 90 days from now.
    // Tools can override either value later with timeMin/timeMax.
    const defaultTimeMin = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );

    const defaultTimeMax = new Date(defaultTimeMin);
    defaultTimeMax.setDate(defaultTimeMax.getDate() + 90);

    const requestedTimeMin = request.nextUrl.searchParams.get("timeMin");
    const requestedTimeMax = request.nextUrl.searchParams.get("timeMax");

    const timeMin = requestedTimeMin
      ? new Date(requestedTimeMin)
      : defaultTimeMin;
    const timeMax = requestedTimeMax
      ? new Date(requestedTimeMax)
      : defaultTimeMax;

    if (
      Number.isNaN(timeMin.getTime()) ||
      Number.isNaN(timeMax.getTime()) ||
      timeMax <= timeMin
    ) {
      return NextResponse.json(
        {
          success: false,
          events: [],
          error: "Invalid Calendar date range.",
        },
        { status: 400 }
      );
    }

    const accessToken = await getGoogleAccessToken(organizationId);

    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "100",
    });

    const googleResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId
      )}/events?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const googleData = await googleResponse.json();

    if (!googleResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          events: [],
          error:
            googleData?.error?.message ||
            `Failed to load Google Calendar events (${googleResponse.status})`,
        },
        { status: googleResponse.status }
      );
    }

    const events = (googleData?.items || []).map((event: any) => {
      const startValue = event?.start?.dateTime || event?.start?.date || null;
      const endValue = event?.end?.dateTime || event?.end?.date || null;
      const allDay = Boolean(event?.start?.date && !event?.start?.dateTime);

      const conferenceEntryPoints =
        event?.conferenceData?.entryPoints?.map((entryPoint: any) => ({
          type: entryPoint?.entryPointType || "",
          uri: entryPoint?.uri || "",
          label: entryPoint?.label || "",
        })) || [];

      const videoEntry = conferenceEntryPoints.find(
        (entryPoint: any) => entryPoint.type === "video"
      );

      return {
        id: event?.id || "",
        calendarId,
        title: event?.summary || "(Untitled event)",
        description: event?.description || "",
        location: event?.location || "",
        status: event?.status || "",
        htmlLink: event?.htmlLink || "",
        created: event?.created || null,
        updated: event?.updated || null,

        start: startValue,
        end: endValue,
        allDay,
        startTimeZone: event?.start?.timeZone || null,
        endTimeZone: event?.end?.timeZone || null,

        creator: {
          email: event?.creator?.email || "",
          name: event?.creator?.displayName || "",
          self: Boolean(event?.creator?.self),
        },

        organizer: {
          email: event?.organizer?.email || "",
          name: event?.organizer?.displayName || "",
          self: Boolean(event?.organizer?.self),
        },

        attendees:
          event?.attendees?.map((attendee: any) => ({
            email: attendee?.email || "",
            name: attendee?.displayName || "",
            responseStatus: attendee?.responseStatus || "",
            organizer: Boolean(attendee?.organizer),
            self: Boolean(attendee?.self),
            optional: Boolean(attendee?.optional),
          })) || [],

        meetUrl: event?.hangoutLink || videoEntry?.uri || "",
        conference: {
          id: event?.conferenceData?.conferenceId || "",
          name:
            event?.conferenceData?.conferenceSolution?.name ||
            event?.conferenceData?.conferenceSolution?.key?.type ||
            "",
          entryPoints: conferenceEntryPoints,
        },

        recurrence: event?.recurrence || [],
        recurringEventId: event?.recurringEventId || null,
        visibility: event?.visibility || "default",
        transparency: event?.transparency || "opaque",
      };
    });

    return NextResponse.json({
      success: true,
      calendarId,
      range: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
      },
      events,
    });
  } catch (error: any) {
    console.error("Google Calendar events route error:", error);

    return NextResponse.json(
      {
        success: false,
        events: [],
        error: error?.message || "Failed to load Google Calendar events.",
      },
      { status: 500 }
    );
  }
}
