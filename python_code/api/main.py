from agent_controller import AgentController

def main():
    agent_controller = AgentController()
    
    # Example usage
    while True:
        user_input = input("You: ")
        if user_input.lower() in ["exit", "quit"]:
            break
        response = agent_controller.get_response(user_input)
        print("Agent:", response)

if __name__ == "__main__":
    main()
