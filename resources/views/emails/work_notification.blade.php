<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 16px;">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #0f172a; padding: 24px 32px; text-align: left; border-bottom: 3px solid #2563eb;">
                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td>
                                        <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px;">
                                            PT Jasa Marga Tollroad Operator
                                        </div>
                                        <div style="font-size: 18px; font-weight: 700; color: #ffffff;">
                                            IT Planning &amp; Governance
                                        </div>
                                    </td>
                                    <td align="right" style="vertical-align: middle;">
                                        <span style="display: inline-block; background-color: #1e293b; color: #38bdf8; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; border: 1px solid #334155;">
                                            Sistem Monitoring PM
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 32px;">
                            
                            <!-- Greeting -->
                            <div style="font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 8px;">
                                Halo, {{ $recipientName }}!
                            </div>
                            <div style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
                                {{ $bodyMessage }}
                            </div>

                            @if(!empty($details) && ($details['type'] ?? '') === 'task_assigned')
                                <!-- Task Card Details -->
                                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px; overflow: hidden;">
                                    
                                    <!-- Card Header: Task Ref & Title -->
                                    <tr>
                                        <td style="padding: 16px 20px; background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0;">
                                            <span style="display: inline-block; background-color: #0f172a; color: #f8fafc; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; margin-right: 8px; vertical-align: middle;">
                                                {{ $details['task_reference'] }}
                                            </span>
                                            <span style="font-size: 15px; font-weight: 700; color: #0f172a; vertical-align: middle;">
                                                {{ $details['task_title'] }}
                                            </span>
                                        </td>
                                    </tr>

                                    <!-- Card Info Rows -->
                                    <tr>
                                        <td style="padding: 16px 20px;">
                                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                                                
                                                <!-- Proyek -->
                                                <tr>
                                                    <td width="130" style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 500;">
                                                        📁 Proyek
                                                    </td>
                                                    <td style="padding: 6px 0; font-size: 13px; color: #0f172a; font-weight: 600;">
                                                        {{ $details['project_name'] }} <span style="color: #64748b; font-weight: 400;">({{ $details['project_key'] }})</span>
                                                    </td>
                                                </tr>

                                                @if(!empty($details['creator_name']))
                                                <!-- Penugasp -->
                                                <tr>
                                                    <td style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 500;">
                                                        👤 Ditugaskan Oleh
                                                    </td>
                                                    <td style="padding: 6px 0; font-size: 13px; color: #0f172a; font-weight: 600;">
                                                        {{ $details['creator_name'] }}
                                                    </td>
                                                </tr>
                                                @endif

                                                <!-- Prioritas -->
                                                <tr>
                                                    <td style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 500;">
                                                        ⚡ Prioritas
                                                    </td>
                                                    <td style="padding: 6px 0; font-size: 13px;">
                                                        <span style="display: inline-block; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; background-color: {{ $details['priority_color'] ?? '#64748b' }}; color: #ffffff;">
                                                            {{ $details['priority_label'] ?? 'Normal' }}
                                                        </span>
                                                    </td>
                                                </tr>

                                                <!-- Status -->
                                                <tr>
                                                    <td style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 500;">
                                                        📊 Status Awal
                                                    </td>
                                                    <td style="padding: 6px 0; font-size: 13px; color: #0f172a; font-weight: 600;">
                                                        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: {{ $details['status_color'] ?? '#94a3b8' }}; margin-right: 6px; vertical-align: middle;"></span>
                                                        <span style="vertical-align: middle;">{{ $details['status_name'] ?? 'To Do' }}</span>
                                                    </td>
                                                </tr>

                                                @if(!empty($details['due_date']))
                                                <!-- Tenggat Waktu -->
                                                <tr>
                                                    <td style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 500;">
                                                        📅 Tenggat Waktu
                                                    </td>
                                                    <td style="padding: 6px 0; font-size: 13px; color: #b91c1c; font-weight: 700;">
                                                        {{ $details['due_date'] }}
                                                    </td>
                                                </tr>
                                                @endif

                                                @if(!empty($details['description']))
                                                <!-- Deskripsi Singkat -->
                                                <tr>
                                                    <td colspan="2" style="padding-top: 14px;">
                                                        <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">
                                                            Catatan / Deskripsi:
                                                        </div>
                                                        <div style="font-size: 13px; color: #334155; line-height: 1.5; background-color: #ffffff; padding: 12px 14px; border-radius: 6px; border: 1px solid #e2e8f0; font-style: italic;">
                                                            &ldquo;{{ $details['description'] }}&rdquo;
                                                        </div>
                                                    </td>
                                                </tr>
                                                @endif

                                            </table>
                                        </td>
                                    </tr>
                                </table>

                            @elseif(!empty($details) && ($details['type'] ?? '') === 'project_member')
                                <!-- Project Member Card Details -->
                                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px; padding: 16px 20px;">
                                    <tr>
                                        <td>
                                            <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
                                                Proyek: {{ $details['project_name'] }} ({{ $details['project_key'] }})
                                            </div>
                                            <div style="font-size: 13px; color: #475569;">
                                                Kamu sekarang telah memiliki akses kerja pada proyek ini.
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            @endif

                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 32px 0 16px 0;">
                                <a href="{{ $url }}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
                                    Buka Detail Tugas di Sistem &rarr;
                                </a>
                            </div>

                            <div style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 12px;">
                                Atau salin tautan berikut di browsermu:<br>
                                <a href="{{ $url }}" style="color: #2563eb; text-decoration: underline; word-break: break-all;">{{ $url }}</a>
                            </div>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
                            <div style="font-size: 12px; color: #64748b; line-height: 1.6; margin-bottom: 8px;">
                                Email ini dikirim secara otomatis oleh <strong>Project Management Internal - ITPG</strong>.<br>
                                Divisi Information Technology Planning &amp; Governance — <strong>PT Jasa Marga Tollroad Operator</strong>
                            </div>
                            <div style="font-size: 11px; color: #94a3b8;">
                                Dokumen ini ditujukan khusus untuk keperluan kedinasan internal. Pengaturan notifikasi email dapat diubah di menu Pengaturan &rarr; Profil.
                            </div>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
