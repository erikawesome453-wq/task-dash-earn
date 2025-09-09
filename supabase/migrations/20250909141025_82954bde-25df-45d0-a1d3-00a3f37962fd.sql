-- Function to update wallet balance when a task is completed
CREATE OR REPLACE FUNCTION update_wallet_on_task_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the user's wallet balance and total earned
    UPDATE profiles 
    SET 
        wallet_balance = wallet_balance + NEW.reward_earned,
        total_earned = total_earned + NEW.reward_earned,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    -- Insert transaction record
    INSERT INTO wallet_transactions (
        user_id,
        transaction_type,
        amount,
        description,
        status
    ) VALUES (
        NEW.user_id,
        'earning',
        NEW.reward_earned,
        'Task completion reward',
        'completed'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update wallet when task is completed
CREATE TRIGGER trigger_update_wallet_on_task_completion
    AFTER INSERT ON user_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_on_task_completion();

-- Update existing completed tasks to fix wallet balances
DO $$
DECLARE
    task_record RECORD;
BEGIN
    FOR task_record IN 
        SELECT user_id, SUM(reward_earned) as total_rewards 
        FROM user_tasks 
        GROUP BY user_id
    LOOP
        UPDATE profiles 
        SET 
            wallet_balance = task_record.total_rewards,
            total_earned = task_record.total_rewards,
            updated_at = NOW()
        WHERE user_id = task_record.user_id;
        
        -- Insert missing transaction records
        INSERT INTO wallet_transactions (
            user_id,
            transaction_type,
            amount,
            description,
            status
        ) 
        SELECT 
            user_id,
            'earning',
            reward_earned,
            'Task completion reward (retroactive)',
            'completed'
        FROM user_tasks 
        WHERE user_id = task_record.user_id
        AND NOT EXISTS (
            SELECT 1 FROM wallet_transactions 
            WHERE user_id = task_record.user_id 
            AND transaction_type = 'earning'
            AND amount = user_tasks.reward_earned
            AND description = 'Task completion reward'
        );
    END LOOP;
END $$;