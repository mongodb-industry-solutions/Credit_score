import scipy.stats as stats

def calculate_percentile_given_value(value, mean, std):
    # Calculate the z-score (standard score)
    z_score = (value - mean) / std

    # Calculate the percentile using the cumulative distribution function (CDF)
    percentile = stats.norm.cdf(z_score) * 100

    return percentile/100


def calculate_credit_score(ip):
    # Assign weightages (you can adjust these based on your requirements)
    weight_payment_history = 0.05
    weight_credit_utilization = 0.5
    weight_credit_history_length = 0.025
    weight_recent_inquiries = 0.4
    weight_of_outstanding = 0.025

    #Calculate individual scores
    score_payment_history = ip["Repayment History"]  * weight_payment_history
    score_credit_utilization = ip["Credit Utilization"] * weight_credit_utilization
    score_credit_history_length = ip["Credit History"] * weight_credit_history_length
    score_recent_inquiries = ip["Num Credit Inquiries"] * weight_recent_inquiries
    score_of_outstanding = ip["Outstanding"] * weight_of_outstanding

    # Calculate overall credit score
    overall_score = (
        score_payment_history
        + score_credit_utilization
        + score_credit_history_length
        + score_recent_inquiries
        + score_of_outstanding
    )

    # Normalize the score
    normalized_score = int((overall_score / 1.0) * 550 + 300)

    return normalized_score