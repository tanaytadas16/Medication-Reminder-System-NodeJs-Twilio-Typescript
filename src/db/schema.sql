CREATE TABLE IF NOT EXISTS call_logs (
    id SERIAL PRIMARY KEY,
    call_sid VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(50) NOT NULL,
    call_status VARCHAR(50) NOT NULL,
    call_duration INTEGER,
    direction VARCHAR(20) NOT NULL,
    answered_by VARCHAR(50),
    recording_url VARCHAR(255),
    response_text TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS call_logs_call_sid_idx ON call_logs(call_sid);
CREATE INDEX IF NOT EXISTS call_logs_phone_number_idx ON call_logs(phone_number);
CREATE INDEX IF NOT EXISTS call_logs_created_at_idx ON call_logs(created_at);